import type {
  SimulationEventId,
  SimulationOptions,
  SimulationStep,
  Transfer,
} from "./simulation";

export type ProcessorKind =
  "api" | "job" | "pipeline" | "database" | "ai" | "human";
export type MessageMode = "free-text" | "structured";
export const processorLabels: Record<ProcessorKind, string> = {
  api: "API / service",
  job: "Background job",
  pipeline: "CI pipeline",
  database: "Database transaction",
  ai: "AI assistance",
  human: "Human decision",
};
export type ProcessingStage = {
  kind: ProcessorKind;
  title: string;
  detail: string;
};
const stage = (
  kind: ProcessorKind,
  title: string,
  detail: string,
): ProcessingStage => ({ kind, title, detail });
const releaseStages = [
  stage(
    "pipeline",
    "Validate manifest",
    "CI checks schema, stable IDs, the approved mapping and build hashes.",
  ),
  stage(
    "pipeline",
    "Build once per tag",
    "GitLab CI publishes immutable HTML and manifest.json under the release tag.",
  ),
  stage(
    "job",
    "Import the release",
    "A sync worker fetches release metadata and the tagged manifest file.",
  ),
  stage(
    "database",
    "Register the release",
    "Store the verified manifest and artifact references; keep existing student pins.",
  ),
];
const compareStages = [
  stage(
    "job",
    "Load pins + manifest",
    "Read the imported manifest and students' existing version pins.",
  ),
  stage(
    "job",
    "Compare explicit rules",
    "Match activity IDs and evaluate criticality and compatible credit deterministically.",
  ),
  stage(
    "database",
    "Save version health",
    "Store the comparison result without changing the student's version.",
  ),
  stage(
    "api",
    "Show the status",
    "LearningAtlas reads the version-health snapshot as JSON.",
  ),
];
const stagesByEvent: Record<SimulationEventId, ProcessingStage[]> = {
  enroll: [
    stage(
      "api",
      "Capture enrollment",
      "Receive a Moodle event; a periodic API read recovers missed events.",
    ),
    stage(
      "job",
      "Normalize + deduplicate",
      "Resolve Moodle IDs and skip the same source revision.",
    ),
    stage(
      "database",
      "Link the student",
      "Save identity and enrollment; leave the version pin empty.",
    ),
    stage(
      "api",
      "Expose the record",
      "Serve the stored enrollment state to LearningAtlas.",
    ),
  ],
  "group-plan": [
    stage(
      "job",
      "Poll Sheets API",
      "Read approved rows with stable row IDs and a sync cursor.",
    ),
    stage(
      "job",
      "Validate typed columns",
      "Resolve group/activity IDs; convert deadlines and time zones to UTC.",
    ),
    stage(
      "database",
      "Store the template",
      "Version the group assignment template and retain the source row revision.",
    ),
  ],
  start: [
    stage(
      "api",
      "Verify Moodle context",
      "Receive authenticated user_id, course_id and the first activity ID.",
    ),
    stage(
      "database",
      "Pin + create track",
      "Lock the latest approved tag once using the unique student/course key.",
    ),
    stage(
      "database",
      "Save outbox atomically",
      "Save the pin, track and delivery records in the same transaction.",
    ),
  ],
  "pin-delivery": [
    stage(
      "job",
      "Read the outbox",
      "A worker picks up the committed version and track revision.",
    ),
    stage(
      "job",
      "Publish pin JSON",
      "Generate the protected student-course-versions.json projection.",
    ),
    stage(
      "api",
      "Configure Moodle",
      "Send version and required activity IDs to the Moodle plugin.",
    ),
    stage(
      "api",
      "Deliver exact HTML",
      "An authenticated service reads the pin and serves its tagged build.",
    ),
  ],
  theory: [
    stage(
      "job",
      "Read completion JSON",
      "Capture completion events and reconcile through Moodle Web Services.",
    ),
    stage(
      "job",
      "Apply completion rule",
      "Match student/activity IDs; evaluate the configured completion flag.",
    ),
    stage(
      "database",
      "Save completion fact",
      "Keep the source revision and evidence; create no quiz grade.",
    ),
    stage(
      "job",
      "Refresh progress",
      "Recalculate accepted required weight and save the metric snapshot.",
    ),
  ],
  quiz: [
    stage(
      "job",
      "Read attempt JSON",
      "Collect attempt ID, score, maximum and source revision from Moodle.",
    ),
    stage(
      "job",
      "Apply attempt policy",
      "Select the best eligible attempt using the course's assessment rule.",
    ),
    stage(
      "database",
      "Save score + evidence",
      "Store the original attempt and selected result with its rubric version.",
    ),
    stage(
      "job",
      "Refresh progress",
      "Update progress and grading coverage before the report API reads them.",
    ),
  ],
  practice: [
    stage(
      "job",
      "Read approved grade",
      "Fetch the Moodle assignment grade and submission identifiers as JSON.",
    ),
    stage(
      "job",
      "Apply acceptance rule",
      "Use the authorized Moodle grade and explicit course policy.",
    ),
    stage(
      "database",
      "Save practical result",
      "Store evidence, score and rubric; avoid a second credit for the same assignment.",
    ),
    stage(
      "job",
      "Refresh the snapshot",
      "Recalculate required progress and grade coverage.",
    ),
  ],
  "mr-submit": [
    stage(
      "api",
      "Capture MR webhook",
      "Receive GitLab JSON; REST reconciliation recovers missed updates.",
    ),
    stage(
      "job",
      "Resolve MR + activity",
      "Use project, author, MR, activity ID and exact head SHA.",
    ),
    stage(
      "database",
      "Save submission evidence",
      "Store the MR link and revision with status under review.",
    ),
  ],
  "moodle-link": [
    stage(
      "api",
      "Read submitted link",
      "Fetch the Moodle assignment submission JSON containing the MR URL.",
    ),
    stage(
      "job",
      "Normalize the MR URL",
      "Resolve project/MR IDs and match the explicit assignment ID.",
    ),
    stage(
      "database",
      "Link existing evidence",
      "Associate both source links with one assignment; credit stays unchanged.",
    ),
  ],
  "mr-review": [
    stage(
      "pipeline",
      "Run tests + analysis",
      "A GitLab runner executes the instructor-approved checks for the exact commit.",
    ),
    stage(
      "ai",
      "Suggest rubric feedback",
      "Claude Code can review code against a rubric and produce a structured recommendation.",
    ),
    stage(
      "job",
      "Import check artifacts",
      "Read test-results.xml and review.json; validate their schema and head SHA.",
    ),
    stage(
      "database",
      "Queue a credit decision",
      "Keep checks and feedback as evidence; acceptance remains a separate decision.",
    ),
  ],
  "accept-practice": [
    stage(
      "human",
      "Review the evidence",
      "An authorized instructor reviews the MR, tests and feedback.",
    ),
    stage(
      "api",
      "Validate the command",
      "Check role, assignment scope and unique request_id.",
    ),
    stage(
      "database",
      "Accept exactly once",
      "Save accepted status and decision evidence without inventing a score.",
    ),
    stage(
      "job",
      "Refresh progress",
      "Recalculate the accepted weight for the student's required track.",
    ),
  ],
  discord: [
    stage(
      "api",
      "Collect the message",
      "A bot receives Gateway JSON and uses REST to reconcile message edits.",
    ),
    stage(
      "ai",
      "Interpret free text",
      "Extract activity, group and deadline with the supporting quotation.",
    ),
    stage(
      "job",
      "Validate the proposal",
      "Check schema, IDs, time zone and author permissions; uncertainty goes to review.",
    ),
    stage(
      "database",
      "Save a draft only",
      "Retain the original message and proposed JSON; the deadline stays unchanged.",
    ),
  ],
  "confirm-deadline": [
    stage(
      "human",
      "Confirm scope + author",
      "Review the quotation, group, activity, deadline and author authority.",
    ),
    stage(
      "api",
      "Authorize the change",
      "Accept an explicit approval command with its source message ID.",
    ),
    stage(
      "database",
      "Revise the deadline",
      "Save the new track revision, old deadline, decision audit and outbox atomically.",
    ),
  ],
  track: [
    stage(
      "human",
      "Select required work",
      "The instructor chooses activities from the pinned course catalog.",
    ),
    stage(
      "api",
      "Check revision + role",
      "Validate expected revision, activity IDs and instructor permissions.",
    ),
    stage(
      "database",
      "Save track + history",
      "Commit the new track revision, old snapshot, audit and outbox together.",
    ),
    stage(
      "job",
      "Recalculate progress",
      "Use the revised required denominator while retaining all existing results.",
    ),
  ],
  "track-delivery": [
    stage(
      "job",
      "Read pending changes",
      "Load the committed track revision from the outbox.",
    ),
    stage(
      "api",
      "Update Moodle context",
      "Deliver the required activity IDs through the plugin configuration API.",
    ),
    stage(
      "job",
      "Refresh pin projection",
      "Publish the matching generated JSON revision to private GitLab storage.",
    ),
  ],
  "release-compatible": releaseStages,
  "compare-compatible": compareStages,
  revisit: [
    stage(
      "api",
      "Authenticate the request",
      "Moodle sends verified user/course context when the lesson is reopened.",
    ),
    stage(
      "database",
      "Read the existing pin",
      "Look up the stored version without changing the pin or learning track.",
    ),
    stage(
      "api",
      "Serve the tagged build",
      "The delivery service checks access and returns the existing HTML artifact.",
    ),
  ],
  "release-critical": releaseStages,
  detect: compareStages,
  migrate: [
    stage(
      "human",
      "Approve the preview",
      "An authorized instructor approves the manifest-based transfer.",
    ),
    stage(
      "api",
      "Validate the command",
      "Check permissions, expected revision and the idempotency key.",
    ),
    stage(
      "database",
      "Commit the migration",
      "Validate the full map; save version, track, transferred evidence, history and outbox atomically.",
    ),
    stage(
      "job",
      "Queue delivery",
      "Workers can deliver the committed change to GitLab and Moodle.",
    ),
  ],
  "migration-delivery": [
    stage(
      "job",
      "Read committed outbox",
      "Load the target version and revision; keep the database authoritative.",
    ),
    stage(
      "api",
      "Update Moodle",
      "Send the version and personal track through the plugin API.",
    ),
    stage(
      "job",
      "Publish pin JSON",
      "Write the protected generated projection to GitLab.",
    ),
    stage(
      "database",
      "Acknowledge or retry",
      "Mark each successful delivery; retain a failed destination for retry.",
    ),
  ],
  retry: [
    stage(
      "job",
      "Find pending delivery",
      "The reconciliation worker compares outbox state and projection revisions.",
    ),
    stage(
      "job",
      "Retry idempotently",
      "Republish only the required revision; skip duplicates and obsolete updates.",
    ),
    stage(
      "api",
      "Serve the current HTML",
      "The delivery service selects the exact build from the database pin.",
    ),
    stage(
      "database",
      "Acknowledge delivery",
      "Record success without transferring credit a second time.",
    ),
  ],
};
export function processingStages(
  step: SimulationStep,
  options: SimulationOptions,
  messageMode: MessageMode = "free-text",
): ProcessingStage[] {
  if (step.id === "migrate" && options.migrationMode === "automatic")
    return [
      stage(
        "job",
        "Run the enabled policy",
        "A scheduled worker checks that the course owner enabled policy@1.",
      ),
      stage(
        "job",
        "Validate transfer rules",
        "Check fresh data, complete mappings and permission for new or repeated work.",
      ),
      stage(
        "database",
        "Commit atomically",
        "Save the new version, revised track, evidence, history and outbox together.",
      ),
      stage(
        "job",
        "Queue delivery",
        "Delivery workers distribute the committed revision to the projections.",
      ),
    ];
  if (step.id === "discord" && messageMode === "structured")
    return stagesByEvent.discord.map((s) =>
      s.kind === "ai"
        ? stage(
            "job",
            "Parse exact fields",
            "Read activity_id, group_id and an ISO 8601 deadline from a structured command.",
          )
        : s,
    );
  return stagesByEvent[step.id];
}
export function stepAiRole(
  step: SimulationStep,
  messageMode: MessageMode = "free-text",
) {
  if (step.id === "discord")
    return messageMode === "free-text"
      ? {
          mode: "interpretation" as const,
          label: "AI for free text",
          detail:
            "Recommended for natural-language clarifications. Its output is a proposal; rights, IDs and time zones still need validation and approval.",
        }
      : {
          mode: "none" as const,
          label: "No AI needed",
          detail:
            "A structured command already provides exact fields. A parser and validation job handle this path.",
        };
  if (step.id === "mr-review")
    return {
      mode: "optional" as const,
      label: "AI review is optional",
      detail:
        "Claude Code adds rubric-based feedback. Test jobs and the instructor's acceptance decision remain separate.",
    };
  return {
    mode: "none" as const,
    label: "No AI needed",
    detail:
      "Exact IDs, schema checks, formulas, manifest rules and authorized commands use deterministic code.",
  };
}

export type DataCarrier =
  "api-json" | "json-file" | "html-build" | "message-json" | "database-rows";
export type TransferProcessing = {
  carrier: DataCarrier;
  format: string;
  file?: string;
  delivery: string;
  processor: string;
  saved: string;
  checks: string;
  sample: { title: string; language: string; content: string; note: string };
};
const jsonSample = (
  title: string,
  payload: Record<string, unknown>,
  note = "Illustrative payload; fields are abbreviated.",
) => ({
  title,
  language: "JSON",
  content: JSON.stringify(payload, null, 2),
  note,
});
export function transferProcessing(
  step: SimulationStep,
  t: Transfer,
  messageMode: MessageMode = "free-text",
): TransferProcessing {
  if (t.from === "db" && t.to === "atlas")
    return {
      carrier: "api-json",
      format: "API response · application/json",
      delivery: "HTTPS response when LearningAtlas refreshes the record",
      processor: "Read API + browser rendering; calculation jobs run upstream",
      saved: "Stored metric/version-health snapshot → report UI",
      checks:
        "Scope access to the course/student; return snapshot revision and source provenance.",
      sample: jsonSample("Report API response", t.payload),
    };
  if (t.from === "db" && t.to === "materials")
    return {
      carrier: "json-file",
      format: "Generated JSON file",
      file: "generated/student-course-versions.json",
      delivery: "Outbox job → GitLab Repository Files API over HTTPS",
      processor: "Projection export job serializes the committed version pin",
      saved:
        "Private generated projection, separate from immutable tagged course content",
      checks:
        "Validate schema and revision; acknowledge delivery only after success. Retry failures without rolling back the database.",
      sample: jsonSample(
        "student-course-versions.json · target excerpt",
        t.payload,
        "This is a generated file. During a failure it represents the queued target, not an acknowledged update.",
      ),
    };
  if (t.from === "db" && t.to === "moodle")
    return {
      carrier: "api-json",
      format: "API request · application/json",
      delivery: "Outbox delivery job → Moodle plugin API over HTTPS",
      processor: "Delivery worker sends a versioned configuration command",
      saved:
        "Moodle's student/course context and required activity configuration",
      checks:
        "Verify revision and access; repeat safely using request_id; keep previous quiz attempts intact.",
      sample: jsonSample("Moodle configuration request", t.payload),
    };
  if (t.from === "materials" && t.to === "moodle") {
    const file = String(t.payload.artifact);
    return {
      carrier: "html-build",
      format: "HTML + static assets · text/html",
      file,
      delivery: "Authenticated HTTPS download selected by the database pin",
      processor: "Delivery service verifies access and reads the existing pin",
      saved:
        "Immutable course build → browser view; the original artifact remains unchanged",
      checks:
        "Serve the exact pinned tag. A build pipeline ran at publication; reopening the lesson does not rebuild it.",
      sample: {
        title: "Tagged HTML build · illustrative excerpt",
        language: "HTML",
        content: `<!-- ${file} -->\n<article data-course-version="${file.split("/")[1]}">\n  <h1>Course activity</h1>\n  <p>Content from the student's pinned release.</p>\n</article>`,
        note: "The wire payload is HTML and its assets. The JSON inspector above describes build metadata.",
      },
    };
  }
  if (t.from === "materials" && t.to === "db")
    return {
      carrier: "json-file",
      format: "Manifest JSON file + release API JSON",
      file: `${String(t.payload.tag)}/manifest.json`,
      delivery:
        "Release notification → sync job → authenticated fetch of the tagged file",
      processor:
        "GitLab CI builds/validates; a separate sync job imports the approved release",
      saved: "Original manifest + build hashes + canonical course release rows",
      checks:
        "Validate schema, stable IDs, complete mappings, approval and hashes. CI reads explicit criticality rules from the approved manifest.",
      sample: jsonSample(
        "manifest.json · release excerpt",
        t.payload,
        "The complete manifest enumerates every relevant activity. This example shows only the selected release fields.",
      ),
    };
  if (t.from === "sheets" && t.to === "db")
    return {
      carrier: "api-json",
      format: "Sheets rows in an API JSON response",
      delivery: "Scheduled Sheets API read with cursor/range and row revisions",
      processor:
        "Sync job parses typed columns, resolves IDs and converts deadlines to UTC",
      saved: "Raw row JSON + versioned group assignment template",
      checks:
        "Use stable row_id, required flags and explicit time zones. Structured columns are handled by a parser without AI.",
      sample: jsonSample("Sheets API rows · illustrative excerpt", {
        values: [
          [
            "row_id",
            "group_id",
            "activity_id",
            "required",
            "deadline",
            "timezone",
          ],
          [
            "row-12",
            "A",
            "TASK-03",
            true,
            "2026-10-20T23:59:00+03:00",
            "Europe/Kyiv",
          ],
        ],
        template: t.payload,
      }),
    };
  if (t.from === "discord" && t.to === "db")
    return {
      carrier: "message-json",
      format: "Message JSON envelope + text content",
      delivery: "Bot Gateway event + REST recovery of messages and edits",
      processor:
        messageMode === "free-text"
          ? "Bot ingestion job → AI extraction → deterministic validation"
          : "Bot ingestion job → structured-command parser → deterministic validation",
      saved: "Original message JSON + draft clarification + source quotation",
      checks:
        "Validate activity/group IDs, time zone, author authority and the schema. Approval is required before a deadline changes.",
      sample: jsonSample(
        messageMode === "free-text"
          ? "Discord message · input for AI extraction"
          : "Discord structured command · input for a parser",
        {
          id: "105",
          author_id: "teacher-7",
          channel_id: "group-A",
          content:
            messageMode === "free-text"
              ? "For group A, TASK-03 is due on 22 October at 23:59, Europe/Kyiv."
              : "/deadline group_id=A activity_id=TASK-03 due_at=2026-10-22T23:59:00+03:00",
          edited_at: null,
        },
        "Both approaches preserve the source message and produce a proposed change for review.",
      ),
    };
  if (t.from === "work" && t.to === "db")
    return step.id === "mr-review"
      ? {
          carrier: "json-file",
          format: "CI artifacts · XML test results + JSON review",
          file: "test-results.xml + review.json",
          delivery: "Pipeline-completed webhook → job fetches report artifacts",
          processor:
            "GitLab test jobs + optional Claude Code review; ingestion job validates the reports",
          saved:
            "Commit-bound check results and review evidence in the database",
          checks:
            "Bind reports to project, MR and head SHA. A passing test, merged MR or AI recommendation alone does not award credit.",
          sample: jsonSample(
            "review.json · optional AI recommendation",
            {
              ...t.payload,
              project_id: 23,
              head_sha: "demo-sha-a3",
              model_version: "example-review-model@1",
              prompt_version: "practice-review@1",
              findings: [
                {
                  file: "src/Main.java",
                  line: 12,
                  comment: "Add an empty-input test.",
                },
              ],
              numeric_grade: null,
              accepted: false,
            },
            "A .gitlab-ci.yml pipeline runs tests and can invoke an AI review adapter. These are synthetic report fields, not a live AI call.",
          ),
        }
      : {
          carrier: "api-json",
          format: "Webhook body + REST response · application/json",
          delivery: "GitLab webhook over HTTPS; scheduled REST reconciliation",
          processor:
            "Intake job resolves project, MR, author, head SHA and explicit task IDs",
          saved: "Raw MR revision + linked submission evidence",
          checks:
            "Deduplicate origin and revision. Uncertain assignment links go to review; merging does not imply acceptance.",
          sample: jsonSample("GitLab MR event · excerpt", t.payload),
        };
  if (t.from === "moodle" && t.to === "db") {
    const synchronous = step.id === "start" || step.id === "revisit";
    return {
      carrier: "api-json",
      format: "API / event JSON · application/json",
      delivery: synchronous
        ? "Synchronous authenticated Moodle plugin request over HTTPS"
        : "Moodle event + scheduled Web Services JSON reconciliation",
      processor: synchronous
        ? step.id === "start"
          ? "Request handler + atomic version-pin transaction"
          : "Read API + exact existing-pin lookup"
        : "Ingestion job normalizes IDs, deduplicates records and applies the course rule",
      saved:
        step.id === "start"
          ? "Unique version pin + personal track + outbox in one transaction"
          : step.id === "revisit"
            ? "Read the existing pin; no version or track write"
            : "Original source JSON + canonical completion, attempt, grade or submission evidence",
      checks: synchronous
        ? "Verify user/course access. The first start uses the latest approved tag; repeat requests read the existing pin."
        : "Keep source IDs and revisions, attempt/grade policy and evidence. Link a submitted MR URL to one assignment without awarding extra credit.",
      sample: jsonSample(
        synchronous
          ? "Moodle plugin request · example context"
          : "Moodle source record · excerpt",
        t.payload,
      ),
    };
  }
  if (t.from === "atlas" && t.to === "db")
    return {
      carrier: "api-json",
      format: "Authorized command · application/json",
      delivery: "User action → authenticated HTTPS command API",
      processor:
        "API handler validates permissions, scope, expected revision and request_id",
      saved:
        "Decision audit + affected result/track revision; history and outbox where applicable",
      checks:
        "Apply the approved decision atomically and idempotently. No AI interprets or authorizes this command.",
      sample: jsonSample("LearningAtlas command · excerpt", t.payload),
    };
  if (t.from === "db" && t.to === "db")
    return {
      carrier: "database-rows",
      format: "Database rows + stored manifest JSON",
      delivery: "Internal scheduled job; no external network transfer",
      processor:
        "Enabled policy job → deterministic mapping validation → database transaction",
      saved:
        "New pin, track, credit-transfer evidence, old snapshot, decision audit and outbox",
      checks:
        "Require enabled policy, fresh data, a complete approved map and permission for new work. Reject stale revisions; repeat request_id is a no-op.",
      sample: {
        title: "Atomic migration · transaction outline",
        language: "PSEUDOCODE",
        content:
          "READ current pin + track + approved manifest\nCHECK policy + data freshness + expected revision\nMAP activities and transfer only compatible credit\nATOMIC COMMIT:\n  new pin + revised track + results\n  previous snapshot + decision audit + delivery outbox\nRETURN committed revision",
        note: "This outlines database processing. It is not a JSON file transfer or executable SQL.",
      },
    };
  throw new Error(
    `Missing processing guide for ${step.id}: ${t.from} → ${t.to}`,
  );
}
export function extractionExample(t: Transfer, messageMode: MessageMode) {
  return {
    ...t.payload,
    evidence: {
      message_id: "105",
      quotation:
        messageMode === "free-text"
          ? "For group A, TASK-03 is due on 22 October at 23:59, Europe/Kyiv."
          : "/deadline group_id=A activity_id=TASK-03 due_at=2026-10-22T23:59:00+03:00",
    },
    extraction:
      messageMode === "free-text"
        ? {
            method: "AI",
            confidence: 0.94,
            model_version: "example-extraction-model@1",
            prompt_version: "deadline-extraction@1",
          }
        : { method: "structured-parser", schema_version: "deadline-command@1" },
    status: "requires_review",
    changes_applied: false,
  };
}
