import { useState } from "react";
import {
  ArrowRight,
  Braces,
  Database,
  FileCode2,
  FileJson,
  Workflow,
} from "lucide-react";
import type {
  SimulationOptions,
  SimulationStep,
  Transfer,
} from "../simulation";
import {
  extractionExample,
  processingStages,
  processorLabels,
  stepAiRole,
  transferProcessing,
  type MessageMode,
} from "../processing";

export function ProcessingKey() {
  return (
    <details className="processing-key">
      <summary>
        <Workflow size={16} />
        How to read formats, jobs and AI
      </summary>
      <p>
        Format describes what moves. Transport describes how it moves.
        Processing stages show what runs.
      </p>
      <div>
        {[
          ["API JSON", "A JSON request or response sent over HTTPS."],
          [
            "JSON file",
            "A stored document, such as manifest.json or a generated version map.",
          ],
          [
            "Background job",
            "A worker reads, validates or synchronizes data outside the page request.",
          ],
          [
            "CI pipeline",
            "A sequence of jobs triggered by a course tag or student MR.",
          ],
          [
            "Database transaction",
            "Related writes commit together, including history and delivery records.",
          ],
          [
            "AI assistance",
            "Interprets free text or suggests code feedback; validated rules and approvals govern changes.",
          ],
        ].map(([title, detail]) => (
          <div key={title}>
            <strong>{title}</strong>
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </details>
  );
}
export default function ProcessingGuide({
  step,
  transfer,
  options,
  blocked,
  failed,
}: {
  step: SimulationStep;
  transfer: Transfer;
  options: SimulationOptions;
  blocked: boolean;
  failed: boolean;
}) {
  const [messageMode, setMessageMode] = useState<MessageMode>("free-text");
  const stages = processingStages(step, options, messageMode);
  const ai = stepAiRole(step, messageMode);
  const profile = transferProcessing(step, transfer, messageMode);
  const FormatIcon =
    profile.carrier === "html-build"
      ? FileCode2
      : profile.carrier === "database-rows"
        ? Database
        : profile.carrier === "json-file"
          ? FileJson
          : Braces;
  const kinds = [...new Set(stages.map((s) => s.kind))];
  const discordSource = step.id === "discord" && transfer.from === "discord";
  return (
    <section
      className="processing-guide"
      id="event-processing-guide"
      tabIndex={-1}
      aria-label="Data processing for this step"
      data-testid="processing-guide"
    >
      <div className="processing-heading">
        <div>
          <span className="eyebrow">
            FORMAT → DELIVERY → PROCESSING → RESULT
          </span>
          <h3>How this step runs</h3>
        </div>
        <span className="processing-design-note">
          Proposed implementation · synthetic examples
        </span>
      </div>
      <h4>This selected transfer</h4>
      <dl className="processing-facts">
        <div>
          <dt>Data format</dt>
          <dd data-testid="transfer-format">
            <FormatIcon size={16} aria-hidden="true" />
            {profile.format}
          </dd>
          {profile.file && (
            <dd>
              <code>{profile.file}</code>
            </dd>
          )}
        </div>
        <div>
          <dt>How it travels</dt>
          <dd>{profile.delivery}</dd>
        </div>
        <div>
          <dt>What processes it</dt>
          <dd>{profile.processor}</dd>
        </div>
        <div>
          <dt>
            {blocked
              ? "Target after validation"
              : failed
                ? "Target awaiting retry"
                : "Where the result is kept"}
          </dt>
          <dd>{profile.saved}</dd>
        </div>
      </dl>
      <h4>Whole event: processing chain</h4>
      <div
        className="processor-badges"
        aria-label="Processors used in this event"
      >
        {kinds.map((kind) => (
          <span className={`processor-badge processor-${kind}`} key={kind}>
            {processorLabels[kind]}
          </span>
        ))}
      </div>
      {step.id === "discord" && (
        <div className="message-processing-choice">
          <span>Compare message formats</span>
          <div className="tabs" aria-label="Discord processing approach">
            <button
              className={messageMode === "free-text" ? "selected" : ""}
              aria-pressed={messageMode === "free-text"}
              onClick={() => setMessageMode("free-text")}
            >
              Free text + AI
            </button>
            <button
              className={messageMode === "structured" ? "selected" : ""}
              aria-pressed={messageMode === "structured"}
              onClick={() => setMessageMode("structured")}
            >
              Structured command + parser
            </button>
          </div>
          <small>
            This compares processing approaches. Both produce a proposal; the
            journey result stays unchanged.
          </small>
        </div>
      )}
      <ol
        className="processing-chain"
        aria-label="Processing stages for this event"
        data-testid="processing-stages"
      >
        {stages.map((s, i) => (
          <li key={s.title}>
            <span className={`processor-badge processor-${s.kind}`}>
              {i + 1} · {processorLabels[s.kind]}
            </span>
            <strong>{s.title}</strong>
            <span>{s.detail}</span>
            {i < stages.length - 1 && (
              <ArrowRight
                className="processing-arrow"
                size={18}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
      <div
        className={`processing-ai processing-ai-${ai.mode}`}
        data-testid="processing-ai"
      >
        <span>AI IN THIS EVENT</span>
        <strong>{ai.label}</strong>
        <p>{ai.detail}</p>
      </div>

      <div className="processing-checks">
        <strong>Checks before applying changes</strong>
        <span>{profile.checks}</span>
        {blocked && (
          <span className="processing-waiting">
            Migration is blocked. These stages and outputs describe the proposed
            change.
          </span>
        )}
        {failed && (
          <span className="processing-waiting">
            Delivery is pending. The worker has not acknowledged this projection
            update.
          </span>
        )}
      </div>
      <details className="processing-example">
        <summary>Inspect example · {profile.sample.language}</summary>
        <span>{profile.sample.title}</span>
        <pre data-testid="processing-sample">{profile.sample.content}</pre>
        <small>{profile.sample.note}</small>
      </details>
      {discordSource && (
        <details className="processing-example">
          <summary>Inspect proposed clarification · JSON</summary>
          <span>
            {messageMode === "free-text"
              ? "AI extraction → schema validation → review queue"
              : "Parser output → schema validation → review queue"}
          </span>
          <pre data-testid="extraction-sample">
            {JSON.stringify(extractionExample(transfer, messageMode), null, 2)}
          </pre>
          <small>
            Model/prompt versions and confidence apply to the AI path. Approval,
            author authority and source evidence are still required. No AI call
            is made by this demo.
          </small>
        </details>
      )}
    </section>
  );
}
