import { describe, expect, it } from "vitest";
import {
  newRun,
  simulate,
  simulationSteps,
  type SimulationCourse,
  type SimulationOptions,
} from "./simulation";
import {
  extractionExample,
  processingStages,
  stepAiRole,
  transferProcessing,
} from "./processing";
const options = newRun().options;
const step = (id: string, mode: SimulationOptions = options) =>
  simulationSteps("java", mode).find((s) => s.id === id)!;

describe("Processing coverage across both complete learning journeys", () => {
  it.each(["ai", "java"] as SimulationCourse[])(
    "describes every %s event and every transfer in both decision modes",
    (course) => {
      for (const migrationMode of ["manual", "automatic"] as const) {
        const config = { ...options, migrationMode };
        for (const event of simulationSteps(course, config)) {
          const stages = processingStages(event, config);
          expect(stages.length).toBeGreaterThanOrEqual(3);
          expect(stages.every((s) => s.kind && s.title && s.detail)).toBe(true);
          for (const transfer of event.transfers) {
            const p = transferProcessing(event, transfer);
            for (const text of [
              p.format,
              p.delivery,
              p.processor,
              p.saved,
              p.checks,
              p.sample.content,
            ])
              expect(text.length).toBeGreaterThan(8);
            if (p.carrier === "json-file" || p.carrier === "html-build")
              expect(p.file).toBeTruthy();
            if (p.sample.language === "JSON")
              expect(() => JSON.parse(p.sample.content)).not.toThrow();
          }
        }
      }
    },
  );
  it("classifies deterministic rules and only identifies AI in interpretation/review events", () => {
    for (const event of simulationSteps("java", options)) {
      const usesAi = processingStages(event, options).some(
        (s) => s.kind === "ai",
      );
      expect(usesAi).toBe(["discord", "mr-review"].includes(event.id));
      if (!["discord", "mr-review"].includes(event.id))
        expect(stepAiRole(event).mode).toBe("none");
    }
  });
});
describe("File, API, job and pipeline boundaries", () => {
  it("distinguishes a generated pin file from a Moodle API command and tagged HTML delivery", () => {
    const event = step("pin-delivery");
    const file = transferProcessing(event, event.transfers[0]);
    const command = transferProcessing(event, event.transfers[1]);
    const html = transferProcessing(event, event.transfers[2]);
    expect(file.carrier).toBe("json-file");
    expect(file.file).toContain("student-course-versions.json");
    expect(file.checks).toContain("acknowledge delivery only after success");
    expect(command.carrier).toBe("api-json");
    expect(command.file).toBeUndefined();
    expect(html.carrier).toBe("html-build");
    expect(html.file).toContain("course-v1/index.html");
    expect(html.sample.language).toBe("HTML");
    expect(html.sample.content).toContain("<article");
    expect(html.checks).toContain("does not rebuild");
  });
  it("keeps the first-activity request synchronous and publication pipelines separate from reopen requests", () => {
    const start = step("start"),
      revisit = step("revisit"),
      release = step("release-critical");
    expect(transferProcessing(start, start.transfers[0]).delivery).toContain(
      "Synchronous",
    );
    expect(processingStages(start, options).some((s) => s.kind === "job")).toBe(
      false,
    );
    expect(
      processingStages(revisit, options).some((s) => s.kind === "pipeline"),
    ).toBe(false);
    const stages = processingStages(release, options).map((s) => s.kind);
    expect(stages).toContain("pipeline");
    expect(stages).toContain("job");
    const manifest = transferProcessing(release, release.transfers[0]);
    expect(manifest.file).toBe("course-v3/manifest.json");
    expect(manifest.carrier).toBe("json-file");
  });
  it("describes Sheets typed rows and report snapshots as API data rather than files", () => {
    const sheet = step("group-plan"),
      report = step("quiz");
    const rows = transferProcessing(sheet, sheet.transfers[0]);
    const snapshot = transferProcessing(report, report.transfers[1]);
    expect(rows.carrier).toBe("api-json");
    expect(rows.processor).toContain("typed columns");
    expect(rows.file).toBeUndefined();
    expect(snapshot.file).toBeUndefined();
    expect(snapshot.processor).toContain("calculation jobs run upstream");
  });
  it("shows automatic migration as an internal deterministic transaction rather than an AI or file transfer", () => {
    const automatic = { ...options, migrationMode: "automatic" as const };
    const event = step("migrate", automatic);
    const p = transferProcessing(event, event.transfers[0]);
    expect(p.carrier).toBe("database-rows");
    expect(p.file).toBeUndefined();
    expect(p.delivery).toContain("no external network transfer");
    expect(
      processingStages(event, automatic).some(
        (s) => s.kind === "human" || s.kind === "ai",
      ),
    ).toBe(false);
    expect(stepAiRole(event).mode).toBe("none");
    expect(p.sample.content).toContain("ATOMIC COMMIT");
  });
});
describe("AI suggestions and validation gates", () => {
  it("switches free-text interpretation to a deterministic parser while keeping both outputs as review proposals", () => {
    const event = step("discord"),
      transfer = event.transfers[0];
    expect(
      processingStages(event, options, "free-text").some(
        (s) => s.kind === "ai",
      ),
    ).toBe(true);
    expect(
      processingStages(event, options, "structured").some(
        (s) => s.kind === "ai",
      ),
    ).toBe(false);
    expect(stepAiRole(event, "free-text").mode).toBe("interpretation");
    expect(stepAiRole(event, "structured").mode).toBe("none");
    for (const mode of ["free-text", "structured"] as const) {
      const extracted = extractionExample(transfer, mode);
      expect(extracted.status).toBe("requires_review");
      expect(extracted.changes_applied).toBe(false);
      expect(extracted.evidence.message_id).toBe("105");
      expect(extracted).toHaveProperty(
        "proposed_due_at",
        "2026-10-22T20:59:00Z",
      );
      expect(transferProcessing(event, transfer, mode).checks).toContain(
        "author authority",
      );
    }
    expect(extractionExample(transfer, "free-text").extraction).toHaveProperty(
      "model_version",
    );
    expect(
      extractionExample(transfer, "structured").extraction,
    ).not.toHaveProperty("model_version");
  });
  it("keeps AI code review optional, tied to a commit and separate from acceptance", () => {
    const event = step("mr-review"),
      report = transferProcessing(event, event.transfers[0]);
    expect(stepAiRole(event).mode).toBe("optional");
    expect(report.file).toContain("test-results.xml");
    expect(report.file).toContain("review.json");
    const parsed = JSON.parse(report.sample.content);
    expect(parsed.accepted).toBe(false);
    expect(parsed.numeric_grade).toBeNull();
    expect(report.checks).toContain("head SHA");
    expect(report.sample.note).toContain(".gitlab-ci.yml");
  });
  it("only explains processing and leaves simulated progress and history unchanged", () => {
    const cursor = simulationSteps("java", options).findIndex(
      (s) => s.id === "discord",
    );
    const before = simulate("java", cursor, options);
    const e = before.steps[cursor];
    for (const mode of ["free-text", "structured"] as const) {
      processingStages(e, options, mode);
      extractionExample(e.transfers[0], mode);
      e.transfers.forEach((t) => transferProcessing(e, t, mode));
    }
    expect(simulate("java", cursor, options)).toEqual(before);
    expect(before.state.clarification).toBe("proposed");
  });
});
