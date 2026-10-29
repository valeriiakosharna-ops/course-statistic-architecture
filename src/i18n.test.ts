import { afterEach, describe, expect, it } from "vitest";
import {
  getLanguage,
  localizeProps,
  setLanguage,
  subscribeLanguage,
  translateText,
} from "./i18n";
import { emptyScenarioFilters, filterScenarios, scenarios } from "./scenarios";
import { vocabulary } from "./platform";
import { newRun, simulationSteps } from "./simulation";
import { processingStages, stepAiRole, transferProcessing } from "./processing";

afterEach(() => setLanguage("en"));
describe("Site-wide Ukrainian presentation", () => {
  it("translates every scenario field, not only the case titles", () => {
    for (const s of scenarios)
      for (const text of [
        s.title,
        ...s.flow,
        s.question,
        ...s.choices,
        ...s.facts,
      ])
        expect(translateText(text, "uk"), `${s.id}: ${text}`).toMatch(
          /\p{Script=Cyrillic}/u,
        );
    for (const term of vocabulary)
      expect(translateText(term.definition, "uk")).toMatch(
        /\p{Script=Cyrillic}/u,
      );
  });
  it("translates every learning event and its processing description in both courses", () => {
    for (const course of ["ai", "java"] as const)
      for (const migrationMode of ["manual", "automatic"] as const) {
        const options = { ...newRun().options, migrationMode };
        for (const event of simulationSteps(course, options)) {
          for (const stage of processingStages(event, options)) {
            expect(translateText(stage.title, "uk")).toMatch(
              /\p{Script=Cyrillic}/u,
            );
            expect(translateText(stage.detail, "uk")).toMatch(
              /\p{Script=Cyrillic}/u,
            );
          }
          expect(translateText(stepAiRole(event).detail, "uk")).toMatch(
            /\p{Script=Cyrillic}/u,
          );
          for (const transfer of event.transfers) {
            const p = transferProcessing(event, transfer);
            for (const text of [
              p.format,
              p.delivery,
              p.processor,
              p.saved,
              p.checks,
            ])
              expect(translateText(text, "uk"), text).toMatch(
                /\p{Script=Cyrillic}/u,
              );
          }
        }
      }
  });
  it("preserves interpolated identifiers, numerals and whitespace", () => {
    expect(translateText("  Pinned v3 · track R2 ", "uk")).toBe(
      "  Закріплено v3 · трек R2 ",
    );
    expect(translateText("3/4 accepted · Student 01", "uk")).toBe(
      "3/4 зараховано · Студент 01",
    );
    expect(translateText("course-v3/index.html", "uk")).toBe(
      "course-v3/index.html",
    );
    expect(translateText("Student 01", "en")).toBe("Student 01");
  });
  it("localizes host presentation while preserving controls, commands and technical examples", () => {
    setLanguage("uk");
    const onChange = () => {};
    expect(localizeProps("option", { children: "Deadlines" })).toEqual({
      children: "Дедлайни",
      value: "Deadlines",
    });
    expect(
      localizeProps("input", {
        placeholder: "Find a term",
        value: "manifest",
        onChange,
        "aria-label": "Find a term",
      }),
    ).toEqual({
      placeholder: "Знайти поняття",
      value: "manifest",
      onChange,
      "aria-label": "Знайти поняття",
    });
    const code = { children: '{"status":"accepted"}' };
    expect(localizeProps("pre", code)).toBe(code);
    const props = { id: "theory", title: "Theory" };
    expect(localizeProps(() => null, props)).toBe(props);
  });
  it("searches both languages and notifies subscribers without replacing domain state", () => {
    let notifications = 0;
    const stop = subscribeLanguage(() => {
      notifications++;
    });
    setLanguage("uk");
    setLanguage("uk");
    expect(getLanguage()).toBe("uk");
    expect(notifications).toBe(1);
    stop();
    expect(
      filterScenarios({ ...emptyScenarioFilters, query: "назва MR" }).map(
        (s) => s.id,
      ),
    ).toContain("wrong-mr-title");
    expect(
      filterScenarios({ ...emptyScenarioFilters, query: "wrong title" }).map(
        (s) => s.id,
      ),
    ).toContain("wrong-mr-title");
  });
});
