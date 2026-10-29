import { searchableText } from "./i18n";
export const scenarioGroups = [
  {
    id: "entry",
    title: "Entry & identity",
    prompt: "Who starts, and with what?",
  },
  {
    id: "versions",
    title: "Version & track",
    prompt: "What changes in the learning plan?",
  },
  {
    id: "time",
    title: "Time & deadlines",
    prompt: "Which clock and deadline apply?",
  },
  {
    id: "sheets",
    title: "A living spreadsheet",
    prompt: "What if the plan keeps changing?",
  },
  {
    id: "submission",
    title: "Submissions & MR rules",
    prompt: "What counts as a valid hand-in?",
  },
  {
    id: "review",
    title: "Assessment & credit",
    prompt: "What counts as completed work?",
  },
  {
    id: "participation",
    title: "Participation & groups",
    prompt: "Who is learning with whom?",
  },
  {
    id: "records",
    title: "Conflicts & missing facts",
    prompt: "What if the evidence disagrees?",
  },
  {
    id: "completion",
    title: "Completion & return",
    prompt: "When is the course really finished?",
  },
  {
    id: "combined",
    title: "Combined changes",
    prompt: "What happens when cases overlap?",
  },
] as const;
export type ScenarioGroup = (typeof scenarioGroups)[number]["id"];
export const scenarioPhases = [
  { id: "start", title: "Start", sub: "Enroll · identify · assign" },
  { id: "learn", title: "Learn & submit", sub: "Study · attempt · hand in" },
  { id: "change", title: "Change & review", sub: "Revise · pause · reassess" },
  {
    id: "finish",
    title: "Finish or return",
    sub: "Complete · leave · restart",
  },
] as const;
export type ScenarioPhase = (typeof scenarioPhases)[number]["id"];
export const scenarioDimensions = [
  "Version",
  "Track",
  "Assignments",
  "Deadlines",
  "Submission rules",
  "Assessment",
  "Participation",
  "Identity",
  "Records",
  "Completion",
] as const;
export type ScenarioDimension = (typeof scenarioDimensions)[number];
export type ScenarioKind = "routine" | "change" | "exception";
export const scenarioKindLabels: Record<ScenarioKind, string> = {
  routine: "Routine",
  change: "Change",
  exception: "Exception",
};
export type Scenario = {
  id: string;
  group: ScenarioGroup;
  phase: ScenarioPhase;
  kind: ScenarioKind;
  dimensions: ScenarioDimension[];
  title: string;
  flow: [string, string, string];
  question: string;
  choices: [string, string];
  facts: [string, string, string];
  related?: string[];
};
function scenario(
  group: ScenarioGroup,
  phase: ScenarioPhase,
  kind: ScenarioKind,
  dimensions: ScenarioDimension[],
  details: Omit<Scenario, "group" | "phase" | "kind" | "dimensions">,
): Scenario {
  return { group, phase, kind, dimensions, ...details };
}
export const scenarios: Scenario[] = [
  scenario("entry", "start", "routine", ["Version", "Track"], {
    id: "steady-course",
    title: "One version, one track, steady progress",
    flow: [
      "A learner receives v1 and the standard track.",
      "They complete the assigned activities with no plan changes.",
      "The original plan and completed work can be compared.",
    ],
    question: "What exactly counts as finishing this track?",
    choices: [
      "Every required activity must be accepted.",
      "A score threshold and selected milestones are enough.",
    ],
    facts: [
      "Assigned version and track",
      "Required activities",
      "Completion criteria",
    ],
    related: ["version-only", "track-only", "version-and-track"],
  }),
  scenario("entry", "start", "change", ["Version", "Deadlines"], {
    id: "late-first-start",
    title: "Enrollment now, first activity much later",
    flow: [
      "A learner enrolls but does not begin.",
      "The course changes before their first activity.",
      "Enrollment and actual learning start belong to different dates.",
    ],
    question: "Which date determines the starting version and schedule?",
    choices: [
      "Use the enrollment agreement.",
      "Use the rules in effect at the first activity.",
    ],
    facts: [
      "Enrollment date",
      "First activity date",
      "Changes between these dates",
    ],
  }),
  scenario("entry", "start", "routine", ["Track", "Assessment"], {
    id: "prior-learning",
    title: "A newcomer already knows part of the course",
    flow: [
      "A learner brings earlier study or work experience.",
      "They request an exemption or take a placement test.",
      "Some required activities may be unnecessary for this person.",
    ],
    question: "What evidence is sufficient to skip an activity?",
    choices: [
      "Recognize verified prior learning.",
      "Require a new demonstration under the current criteria.",
    ],
    facts: ["Prior evidence", "Placement result", "Who can grant exemptions"],
  }),
  scenario("entry", "start", "exception", ["Identity", "Records"], {
    id: "two-accounts",
    title: "One learner appears under two accounts",
    flow: [
      "The same person studies and submits under different names.",
      "Work appears to belong to two people.",
      "The learner's full history is uncertain.",
    ],
    question: "How can the two identities be confirmed as the same person?",
    choices: [
      "Combine verified records into one history.",
      "Keep disputed work separate until identity is confirmed.",
    ],
    facts: [
      "Account ownership",
      "Original submission authors",
      "Overlapping attempts",
    ],
  }),
  scenario("entry", "start", "exception", ["Version", "Track"], {
    id: "missing-starting-plan",
    title: "Learning starts before a plan is assigned",
    flow: [
      "A learner can access course materials.",
      "They start work without a clear version or track.",
      "Completed work has no agreed set of requirements.",
    ],
    question: "Can early work count once the starting plan is agreed?",
    choices: [
      "Assess it against the agreed starting requirements.",
      "Require an explicit exception for each earlier result.",
    ],
    facts: [
      "Activities already attempted",
      "Available instructions at the time",
      "Date the plan was agreed",
    ],
  }),
  scenario("entry", "start", "exception", ["Identity", "Participation"], {
    id: "duplicate-enrollment",
    title: "A learner is enrolled twice",
    flow: [
      "A learner has an existing course enrollment.",
      "A second enrollment is created in the same or another group.",
      "It is unclear whether this is a duplicate or a separate attempt.",
    ],
    question: "Are these two enrollments one learning journey or two?",
    choices: [
      "Treat the second as a duplicate.",
      "Keep a separate attempt with its own obligations.",
    ],
    facts: [
      "Enrollment purpose",
      "Group membership dates",
      "Work already credited",
    ],
  }),

  scenario("versions", "change", "change", ["Version"], {
    id: "version-only",
    title: "The version changes; the track stays",
    flow: [
      "A learner follows v1 and the standard track.",
      "They move to v2 with the same learning goals.",
      "Old results meet content that may have changed.",
    ],
    question: "Which results still demonstrate the required knowledge?",
    choices: [
      "Carry compatible work and repeat changed parts.",
      "Reassess the affected activities before granting credit.",
    ],
    facts: [
      "Old and new activity requirements",
      "Work already accepted",
      "Effective change date",
    ],
    related: ["track-only", "version-and-track", "changed-activity"],
  }),
  scenario("versions", "change", "change", ["Track", "Assignments"], {
    id: "track-only",
    title: "The track changes; the version stays",
    flow: [
      "A learner studies v1 on a standard track.",
      "They switch to a shorter, advanced or specialist track.",
      "Required work changes while course content stays the same.",
    ],
    question:
      "What happens to completed work and activities already in progress?",
    choices: [
      "Keep relevant credit and mark other work as extra.",
      "Review each changed obligation individually.",
    ],
    facts: [
      "Old and new required activities",
      "Work in progress",
      "Reason for the track change",
    ],
    related: ["required-work-removed", "extra-work", "version-and-track"],
  }),
  scenario(
    "versions",
    "change",
    "change",
    ["Version", "Track", "Assignments"],
    {
      id: "version-and-track",
      title: "Both version and track change",
      flow: [
        "A learner has partial progress on v1 and track A.",
        "They move to v2 and track B at the same time.",
        "Both activity meaning and required scope may differ.",
      ],
      question: "Which old results cover which new obligations?",
      choices: [
        "Evaluate both changes together before continuing.",
        "Make two explicit transitions with an intermediate plan.",
      ],
      facts: [
        "Both starting and target plans",
        "Accepted and unfinished work",
        "Transition agreement",
      ],
      related: ["version-only", "track-only", "change-during-review"],
    },
  ),
  scenario("versions", "change", "change", ["Version", "Assessment"], {
    id: "cosmetic-or-critical",
    title: "A typo fix or a new learning objective",
    flow: [
      "A course update is announced.",
      "The change ranges from wording to a new required skill.",
      "A new version alone does not explain the learner's obligation.",
    ],
    question:
      "Which kinds of changes require further learning or reassessment?",
    choices: [
      "Keep credit when learning outcomes are unchanged.",
      "Require fresh evidence when the assessed skill changes.",
    ],
    facts: [
      "Nature of the change",
      "Affected learning outcomes",
      "Assessment differences",
    ],
  }),
  scenario("versions", "change", "change", ["Version", "Assignments"], {
    id: "changed-activity",
    title: "An activity is split, merged or replaced",
    flow: [
      "A learner completed one activity under the old plan.",
      "The next plan splits it into two, merges it or replaces it.",
      "Activity counts no longer show equivalent learning.",
    ],
    question: "How much of the new requirement does earlier work cover?",
    choices: [
      "Recognize partial coverage and assign the missing part.",
      "Use a fresh assessment to establish coverage.",
    ],
    facts: [
      "Old activity outcomes",
      "New activity outcomes",
      "Evidence of each skill",
    ],
  }),
  scenario("versions", "change", "exception", ["Version", "Participation"], {
    id: "old-version-retired",
    title: "The learner's old version is no longer available",
    flow: [
      "A learner is still working through an older edition.",
      "Its materials, tools or support are retired.",
      "The agreed plan cannot be followed as before.",
    ],
    question: "What is a fair way for this person to continue?",
    choices: [
      "Provide an equivalent supported path.",
      "Agree a new plan with explicit recognition of earlier work.",
    ],
    facts: [
      "What became unavailable",
      "Original commitments",
      "Remaining learner obligations",
    ],
  }),
  scenario("versions", "change", "exception", ["Version", "Track", "Records"], {
    id: "wrong-plan-corrected",
    title: "A version or track was assigned by mistake",
    flow: [
      "A learner has already acted on an assigned plan.",
      "An instructor discovers that the assignment was wrong.",
      "A correction may affect work the learner reasonably completed.",
    ],
    question:
      "How should the learner be protected from an administrative mistake?",
    choices: [
      "Honor completed work where it meets the intended outcomes.",
      "Agree compensating work and adjusted deadlines.",
    ],
    facts: [
      "What the learner was told",
      "Work done before correction",
      "Intended starting plan",
    ],
  }),
  scenario("versions", "change", "change", ["Version", "Track"], {
    id: "declined-transition",
    title: "A learner declines a proposed change",
    flow: [
      "A new version or track is offered.",
      "The learner asks to stay on the existing plan.",
      "The learner's preference may conflict with course constraints.",
    ],
    question: "When is staying allowed, and who can decide?",
    choices: [
      "Allow the old plan until an agreed cutoff.",
      "Require a transition with notice and a review route.",
    ],
    facts: [
      "Reason for the change",
      "Consent or notification terms",
      "Support cutoff",
    ],
  }),

  scenario("time", "learn", "routine", ["Deadlines", "Completion"], {
    id: "early-finish",
    title: "A learner finishes earlier than planned",
    flow: [
      "The course has a planned end date.",
      "A learner completes the required work ahead of schedule.",
      "Learning completion and the scheduled end date differ.",
    ],
    question: "Can completion be confirmed before the scheduled end?",
    choices: [
      "Confirm once all criteria are met.",
      "Wait for final review or a cohort milestone.",
    ],
    facts: ["Completion evidence", "Review status", "Scheduled milestones"],
  }),
  scenario("time", "change", "exception", ["Deadlines", "Participation"], {
    id: "longer-than-planned",
    title: "Learning takes longer than planned",
    flow: [
      "A learner is expected to finish in eight weeks.",
      "Week eight ends with unfinished work.",
      "The learner still wants to continue.",
    ],
    question:
      "Does the end date stop learning, or trigger an extension decision?",
    choices: [
      "Continue under an agreed extension.",
      "Close this attempt and discuss a later restart.",
    ],
    facts: [
      "Remaining work",
      "Access and support terms",
      "Extension agreement",
    ],
    related: [
      "pause-and-return",
      "old-version-retired",
      "overrun-and-retirement",
    ],
  }),
  scenario("time", "change", "change", ["Deadlines"], {
    id: "deadline-extended",
    title: "A deadline moves later",
    flow: [
      "An assignment has a Friday deadline.",
      "An extension moves it to Monday.",
      "Some work was already marked late under the earlier date.",
    ],
    question:
      "Does the extension also change earlier late labels or penalties?",
    choices: [
      "Reconsider work covered by the extension.",
      "Apply the extension only from its announced effective time.",
    ],
    facts: [
      "Old and new deadlines",
      "Who the extension covers",
      "Announcement and effective times",
    ],
  }),
  scenario("time", "change", "change", ["Deadlines", "Assignments"], {
    id: "deadline-shortened",
    title: "A deadline moves earlier",
    flow: [
      "A learner plans around next week's deadline.",
      "An instructor moves the due date to tomorrow.",
      "Available preparation time is unexpectedly reduced.",
    ],
    question: "Can an earlier deadline apply to work already assigned?",
    choices: [
      "Honor the previously communicated deadline.",
      "Use the new deadline with notice and individual exceptions.",
    ],
    facts: [
      "Original notice",
      "Time remaining",
      "Reason and authority for the change",
    ],
  }),
  scenario("time", "change", "change", ["Deadlines", "Track"], {
    id: "personal-extension",
    title: "One learner gets an extension; the group does not",
    flow: [
      "A group shares one schedule.",
      "One learner receives a personal extension.",
      "Two valid deadlines exist for the same activity.",
    ],
    question:
      "How long does the personal exception override the group schedule?",
    choices: [
      "Keep the explicit personal deadline until revoked.",
      "Reconfirm the exception when the group schedule changes.",
    ],
    facts: [
      "Affected learner and activity",
      "Exception approval",
      "Later group changes",
    ],
    related: ["sheet-personal-override", "sheet-and-clarification"],
  }),
  scenario("time", "learn", "exception", ["Deadlines", "Submission rules"], {
    id: "timezone-and-cutoff",
    title: "A submission sits on the deadline boundary",
    flow: [
      "A deadline says midnight without a clear timezone.",
      "A learner submits while the reviewer sees a different date.",
      "The same submission can appear on time or late.",
    ],
    question: "Which timezone, timestamp and grace period define lateness?",
    choices: [
      "Use a declared course timezone and submission time.",
      "Use an explicitly agreed personal cutoff and grace window.",
    ],
    facts: [
      "Timezone and daylight-saving rule",
      "Submission timestamp",
      "Grace-period terms",
    ],
  }),
  scenario("time", "learn", "exception", ["Deadlines", "Assessment"], {
    id: "submitted-before-reviewed-after",
    title: "Submitted on time, reviewed after the deadline",
    flow: [
      "A learner submits before the cutoff.",
      "Review happens later and asks for corrections.",
      "The first submission and accepted result have different dates.",
    ],
    question:
      "Which event determines timeliness, and when is the revision due?",
    choices: [
      "Keep the first valid submission date and set a revision window.",
      "Assess timeliness against explicitly stated acceptance rules.",
    ],
    facts: [
      "First valid submission",
      "Review and revision dates",
      "Published timeliness rules",
    ],
  }),

  scenario(
    "sheets",
    "start",
    "routine",
    ["Assignments", "Deadlines", "Track"],
    {
      id: "sheet-starting-plan",
      title: "Google Sheets defines the starting work plan",
      flow: [
        "A sheet lists learners, required practices and due dates.",
        "A learner begins with the assignments shown there.",
        "The sheet describes their practical obligations.",
      ],
      question: "Is a row a recommendation or an approved assignment?",
      choices: [
        "Treat approved rows as the active learning plan.",
        "Confirm the plan with the learner before it takes effect.",
      ],
      facts: [
        "Learner and activity references",
        "Approval status",
        "Date the plan takes effect",
      ],
    },
  ),
  scenario(
    "sheets",
    "change",
    "change",
    ["Assignments", "Deadlines", "Track"],
    {
      id: "sheet-live-edits",
      title: "Required practices and dates change in Google Sheets",
      flow: [
        "A learner is following the current spreadsheet plan.",
        "A teacher adds a practice, removes another and edits due dates.",
        "The current rows differ from what the learner started with.",
      ],
      question:
        "Which edits apply immediately, and which require notice or agreement?",
      choices: [
        "Apply approved edits from a declared effective date.",
        "Keep a learner's agreed plan until a new revision is confirmed.",
      ],
      facts: [
        "Previous and revised rows",
        "Editor and change time",
        "Affected learners and effective date",
      ],
      related: [
        "sheet-deleted-row",
        "sheet-personal-override",
        "sheet-after-submission",
      ],
    },
  ),
  scenario(
    "sheets",
    "change",
    "change",
    ["Assignments", "Track", "Assessment"],
    {
      id: "sheet-deleted-row",
      title: "An assignment row disappears from the sheet",
      flow: [
        "A required practice has submissions and a grade.",
        "Its row is deleted or left blank.",
        "It is unclear whether the task was canceled or the sheet is incomplete.",
      ],
      question: "Does a missing row remove the obligation or signal a mistake?",
      choices: [
        "Cancel only after an explicit withdrawal decision.",
        "Treat deletion as cancellation under an agreed editing rule.",
      ],
      facts: ["Previous row and work", "Deletion intent", "Cancellation rules"],
    },
  ),
  scenario(
    "sheets",
    "change",
    "change",
    ["Track", "Deadlines", "Participation"],
    {
      id: "sheet-personal-override",
      title: "A group row conflicts with a personal row",
      flow: [
        "A group assignment and a personal exception both exist.",
        "The group date or required practice changes.",
        "The learner now has overlapping instructions.",
      ],
      question:
        "Which instruction takes precedence, for which dates and activities?",
      choices: [
        "Keep the scoped personal exception.",
        "Ask for a new decision when the group plan changes.",
      ],
      facts: [
        "Group plan",
        "Personal exception scope",
        "Effective dates of both",
      ],
    },
  ),
  scenario(
    "sheets",
    "learn",
    "exception",
    ["Records", "Identity", "Assignments"],
    {
      id: "sheet-row-errors",
      title: "Rows are duplicated, renamed, reordered or malformed",
      flow: [
        "A sheet uses names and task labels to identify work.",
        "Someone sorts rows, copies a task or enters an ambiguous date.",
        "The intended learner, task or due date may be unclear.",
      ],
      question:
        "Which edits preserve the same assignment, and which create a new one?",
      choices: [
        "Clarify ambiguous rows before changing obligations.",
        "Apply only the unambiguous parts and flag the rest.",
      ],
      facts: [
        "Original row meaning",
        "Duplicate or renamed entries",
        "Date and learner ambiguity",
      ],
    },
  ),
  scenario(
    "sheets",
    "change",
    "exception",
    ["Records", "Assignments", "Deadlines"],
    {
      id: "sheet-bulk-mistake",
      title: "A bulk spreadsheet edit is accidental",
      flow: [
        "Many learners have active assignments.",
        "A paste overwrites dates or practices and is later undone.",
        "Some learners may have acted during the mistaken interval.",
      ],
      question:
        "Does restoring the sheet also restore the original obligations for everyone?",
      choices: [
        "Restore the previous plan and review affected learners.",
        "Honor commitments made during the mistaken interval where fair.",
      ],
      facts: [
        "Before and after the bulk edit",
        "Who saw the mistaken plan",
        "Work done during the interval",
      ],
    },
  ),
  scenario("sheets", "learn", "exception", ["Records", "Participation"], {
    id: "sheet-unavailable",
    title: "The planning sheet becomes unavailable",
    flow: [
      "Learners use Google Sheets to check required practices and dates.",
      "Access is revoked or the sheet cannot be opened.",
      "Learners cannot verify their current obligations.",
    ],
    question:
      "What instructions remain valid while the plan cannot be checked?",
    choices: [
      "Continue with the last confirmed plan.",
      "Pause affected deadlines until authoritative instructions are available.",
    ],
    facts: [
      "Last confirmed plan",
      "Start and scope of lost access",
      "Temporary instructions",
    ],
  }),

  scenario(
    "submission",
    "learn",
    "routine",
    ["Submission rules", "Assessment"],
    {
      id: "valid-mr",
      title: "An MR follows all published rules",
      flow: [
        "Rules specify the repository, branch, task reference and MR title.",
        "A learner submits an MR that meets these rules.",
        "The hand-in is identifiable and ready for review.",
      ],
      question: "Does valid submission mean received, or also accepted?",
      choices: [
        "Acknowledge receipt; assess the work separately.",
        "Accept only after all published assessment requirements pass.",
      ],
      facts: ["Rules in effect", "Submitted work revision", "Submission time"],
    },
  ),
  scenario(
    "submission",
    "learn",
    "exception",
    ["Submission rules", "Deadlines", "Records"],
    {
      id: "wrong-mr-title",
      title: "The MR title does not follow the naming rule",
      flow: [
        "Rules require a title such as JAVA-03: Student name.",
        "A learner submits an MR titled My solution instead.",
        "The work exists, but its intended task may be unclear.",
      ],
      question:
        "Is this a correctable labeling error or an invalid submission?",
      choices: [
        "Ask for a corrected title and preserve the original receipt time.",
        "Require a valid hand-in and apply the stated correction window.",
      ],
      facts: [
        "Published naming rule",
        "Original title and timestamp",
        "Verified learner and intended task",
      ],
      related: ["mr-renamed", "title-fix-after-cutoff", "wrong-repo-or-branch"],
    },
  ),
  scenario("submission", "learn", "change", ["Submission rules", "Records"], {
    id: "mr-renamed",
    title: "An MR is renamed after submission",
    flow: [
      "An MR has already been linked to a practice.",
      "Its title or task reference changes.",
      "The correction may clarify the task or point to a different one.",
    ],
    question: "When is a rename a correction, and when is it reassignment?",
    choices: [
      "Keep the original task after a verified cosmetic correction.",
      "Review task-changing edits as a new association.",
    ],
    facts: [
      "Original and revised title",
      "Original task association",
      "Reason for the rename",
    ],
  }),
  scenario(
    "submission",
    "learn",
    "exception",
    ["Submission rules", "Assessment"],
    {
      id: "wrong-repo-or-branch",
      title: "Correct work, wrong repository or branch",
      flow: [
        "A learner has completed a practice.",
        "They submit in a different repository, fork or target branch.",
        "The work may be inaccessible or outside the expected review context.",
      ],
      question:
        "Can the location be corrected without losing the original hand-in?",
      choices: [
        "Accept a verified relocation with the original evidence.",
        "Require a new submission in the permitted location.",
      ],
      facts: [
        "Required and actual location",
        "Content equivalence",
        "Reviewer access",
      ],
    },
  ),
  scenario(
    "submission",
    "learn",
    "exception",
    ["Submission rules", "Assessment", "Records"],
    {
      id: "many-mrs-one-practice",
      title: "Several MRs claim the same practice",
      flow: [
        "One practice is required.",
        "A learner opens several MRs or submits the same link twice.",
        "Multiple hand-ins may represent one piece of work or several attempts.",
      ],
      question:
        "Which submission is authoritative, and how many attempts are these?",
      choices: [
        "Choose a final revision and keep earlier attempts as history.",
        "Assess distinct attempts under the published attempt rules.",
      ],
      facts: [
        "MR relationships",
        "Content differences",
        "Learner's final-submission choice",
      ],
    },
  ),
  scenario(
    "submission",
    "learn",
    "exception",
    ["Submission rules", "Assignments"],
    {
      id: "one-mr-many-practices",
      title: "One MR contains several practices",
      flow: [
        "Practices A and B have separate requirements.",
        "A learner puts both solutions in one MR.",
        "Submission boundaries do not match assignment boundaries.",
      ],
      question:
        "Can one hand-in supply independently assessable evidence for both?",
      choices: [
        "Assess each practice separately within the same MR.",
        "Ask for separate submissions under the course rules.",
      ],
      facts: [
        "Included activities",
        "Separability of the work",
        "Submission rules",
      ],
    },
  ),
  scenario(
    "submission",
    "learn",
    "change",
    ["Submission rules", "Assessment", "Deadlines"],
    {
      id: "mr-content-changes",
      title: "Work changes after hand-in or review",
      flow: [
        "A specific revision was submitted or reviewed.",
        "The learner adds commits, rewrites history or replaces the linked work.",
        "The visible work differs from what was originally assessed.",
      ],
      question:
        "Which revision is graded and which timestamp applies to the new work?",
      choices: [
        "Keep the assessed revision and review later changes separately.",
        "Replace the submission with a clearly identified new attempt.",
      ],
      facts: [
        "Submitted and reviewed revisions",
        "Change timestamps",
        "Resubmission rules",
      ],
    },
  ),
  scenario(
    "submission",
    "learn",
    "exception",
    ["Submission rules", "Records", "Deadlines"],
    {
      id: "draft-closed-or-broken-link",
      title: "A draft, closed MR or broken link is handed in",
      flow: [
        "A learner says the practice has been submitted.",
        "The link is private, broken, still a draft or points to a closed MR.",
        "The reviewer cannot tell whether review-ready work was delivered.",
      ],
      question:
        "Which submission states count, and is there a correction period?",
      choices: [
        "Allow a documented access or status correction.",
        "Count receipt only when review-ready evidence is accessible.",
      ],
      facts: [
        "State at hand-in",
        "Access available to the reviewer",
        "Correction deadline",
      ],
    },
  ),

  scenario("review", "learn", "exception", ["Assessment", "Submission rules"], {
    id: "merged-not-accepted",
    title: "The MR is merged, but the practice is not accepted",
    flow: [
      "A learner's MR is merged for collaboration or housekeeping.",
      "Assessment criteria are not yet met or checked.",
      "Repository status and educational acceptance disagree.",
    ],
    question: "Which action actually awards educational credit?",
    choices: [
      "Use a separate assessment decision.",
      "Let merge award credit only under an explicit course rule.",
    ],
    facts: [
      "Reason for merging",
      "Assessment criteria",
      "Acceptance authority",
    ],
  }),
  scenario("review", "learn", "exception", ["Assessment", "Records"], {
    id: "checks-disagree",
    title: "Tests pass, but review disagrees",
    flow: [
      "Automated tests report success.",
      "A human or AI review finds an unmet requirement, or the reverse.",
      "Different checks suggest different outcomes.",
    ],
    question: "Which checks are advisory, mandatory or appealable?",
    choices: [
      "Use an authorized assessment decision to resolve disagreement.",
      "Require all declared mandatory criteria, then permit an appeal.",
    ],
    facts: [
      "Rubric in effect",
      "Evidence from each check",
      "Review authority and appeal rules",
    ],
  }),
  scenario("review", "change", "change", ["Assessment", "Version"], {
    id: "rubric-changes",
    title: "Grading criteria change during the course",
    flow: [
      "A learner prepares work under one rubric.",
      "Weights, pass marks or required criteria change.",
      "The same work can receive a different result.",
    ],
    question: "Which rubric applies to submitted, unfinished and future work?",
    choices: [
      "Preserve the rubric promised for existing work.",
      "Agree reassessment under the new rubric with appropriate notice.",
    ],
    facts: [
      "Both rubrics",
      "When work began and was submitted",
      "Who is covered by the change",
    ],
  }),
  scenario("review", "learn", "routine", ["Assessment", "Deadlines"], {
    id: "retry-and-revision",
    title: "A learner retries a quiz or revises a practice",
    flow: [
      "A first attempt fails or receives partial credit.",
      "A later attempt improves the result.",
      "Several valid results exist for one activity.",
    ],
    question: "Do the best, latest or all attempts determine the outcome?",
    choices: [
      "Use the best permitted attempt.",
      "Use the latest valid attempt under stated limits.",
    ],
    facts: [
      "Attempt sequence",
      "Attempt limits and deadlines",
      "Score-selection rule",
    ],
  }),
  scenario(
    "review",
    "change",
    "exception",
    ["Assessment", "Records", "Completion"],
    {
      id: "grade-correction-or-appeal",
      title: "An accepted grade is corrected or appealed",
      flow: [
        "Work has a published grade and may count toward completion.",
        "A grading error or successful appeal changes the decision.",
        "Past progress and current entitlement may differ.",
      ],
      question:
        "What downstream decisions must be reconsidered after the correction?",
      choices: [
        "Revise affected outcomes and notify the learner.",
        "Protect finalized awards under an explicitly agreed finality rule.",
      ],
      facts: [
        "Original and corrected decisions",
        "Reason and authority",
        "Consequences already issued",
      ],
    },
  ),
  scenario("review", "learn", "exception", ["Assessment", "Identity"], {
    id: "authorship-question",
    title: "The authorship of work is disputed",
    flow: [
      "A learner submits work, possibly using a partner or AI.",
      "A reviewer questions authorship or permitted assistance.",
      "The evidence requires interpretation under the course rules.",
    ],
    question:
      "How is a concern investigated without treating suspicion as proof?",
    choices: [
      "Request an explanation or a demonstration of the skill.",
      "Use the declared academic-integrity review and appeal process.",
    ],
    facts: [
      "Assistance rules communicated in advance",
      "Specific supporting evidence",
      "Learner response",
    ],
  }),

  scenario(
    "participation",
    "change",
    "change",
    ["Participation", "Deadlines", "Track"],
    {
      id: "pause-and-return",
      title: "A learner pauses and later returns",
      flow: [
        "A learner has partial progress and active deadlines.",
        "They pause for illness, leave or personal reasons.",
        "They return after the group or course has moved on.",
      ],
      question:
        "What happens to the clock, access and learning plan during the pause?",
      choices: [
        "Resume the previous plan with adjusted dates.",
        "Agree a new plan and recognize relevant earlier work.",
      ],
      facts: [
        "Pause and return dates",
        "Agreed pause terms",
        "Changes during absence",
      ],
    },
  ),
  scenario(
    "participation",
    "change",
    "change",
    ["Participation", "Track", "Deadlines"],
    {
      id: "group-transfer",
      title: "A learner moves to a different group",
      flow: [
        "A learner follows group A's schedule.",
        "They transfer to group B with different assignments or dates.",
        "Old and new group expectations overlap.",
      ],
      question: "Which unfinished tasks follow the learner into the new group?",
      choices: [
        "Adopt the new group plan with recognized prior work.",
        "Keep a personal bridge plan for unfinished activities.",
      ],
      facts: [
        "Transfer effective date",
        "Both group plans",
        "Personal exceptions and unfinished work",
      ],
    },
  ),
  scenario(
    "participation",
    "learn",
    "change",
    ["Participation", "Assessment", "Identity"],
    {
      id: "team-membership-changes",
      title: "A team gains or loses a member",
      flow: [
        "A practical assignment is shared by a team.",
        "A member leaves, joins late or contributes differently.",
        "One shared submission may not represent equal individual learning.",
      ],
      question: "How should responsibilities and individual credit change?",
      choices: [
        "Assess individual contributions within the shared work.",
        "Agree replacement or supplementary tasks for affected members.",
      ],
      facts: [
        "Membership periods",
        "Individual contributions",
        "Team assessment agreement",
      ],
    },
  ),
  scenario(
    "participation",
    "change",
    "exception",
    ["Participation", "Deadlines", "Completion"],
    {
      id: "silent-or-withdrawn",
      title: "A learner disappears or withdraws",
      flow: [
        "A learner stops showing activity.",
        "No one knows whether this is a pause, withdrawal or access problem.",
        "Inactive, overdue and withdrawn are different possible states.",
      ],
      question:
        "What evidence and contact attempts justify changing participation status?",
      choices: [
        "Keep the status unresolved until contact or a declared cutoff.",
        "Apply a documented inactivity policy with a return route.",
      ],
      facts: [
        "Last meaningful activity",
        "Communication attempts",
        "Withdrawal or inactivity rules",
      ],
    },
  ),
  scenario(
    "participation",
    "change",
    "change",
    ["Track", "Assignments", "Participation"],
    {
      id: "accommodation",
      title: "A learner needs an alternative format or task",
      flow: [
        "The assigned activity creates an accessibility or personal constraint.",
        "An equivalent format, schedule or assessment is requested.",
        "The learning outcome may stay the same while the activity changes.",
      ],
      question: "What makes the alternative evidence equivalent?",
      choices: [
        "Agree an equivalent task assessed against the same outcomes.",
        "Create an individualized plan with explicit adjusted criteria.",
      ],
      facts: [
        "Learning outcome to demonstrate",
        "Agreed alternative",
        "Scope and duration of the exception",
      ],
    },
  ),

  scenario("records", "change", "exception", ["Deadlines", "Records"], {
    id: "conflicting-instructions",
    title: "The sheet, course page and message disagree",
    flow: [
      "A learner sees one due date in the plan.",
      "A teacher announces another date in chat; the course page shows a third.",
      "Several plausible instructions exist.",
    ],
    question:
      "Which instruction is authoritative, and was the change approved?",
    choices: [
      "Use a declared precedence rule and verify its scope.",
      "Resolve the conflict explicitly before applying consequences.",
    ],
    facts: [
      "Exact instructions and authors",
      "Announcement times and audience",
      "Approval and precedence rules",
    ],
  }),
  scenario("records", "learn", "exception", ["Records", "Assessment"], {
    id: "late-or-repeated-evidence",
    title: "A result arrives late or appears twice",
    flow: [
      "A learner finishes work once.",
      "Evidence is recorded later, repeated or in a different order.",
      "The recorded timeline may differ from the actual learning timeline.",
    ],
    question:
      "Which events represent the same work, and when did it really happen?",
    choices: [
      "Recognize verified event time and a single underlying attempt.",
      "Keep uncertain evidence unresolved until the timeline is confirmed.",
    ],
    facts: [
      "Original event time",
      "Time the evidence became available",
      "Whether records describe the same attempt",
    ],
  }),
  scenario(
    "records",
    "learn",
    "exception",
    ["Records", "Assessment", "Identity"],
    {
      id: "unlinked-evidence",
      title: "Evidence has no clear learner or activity",
      flow: [
        "A result or submission is available.",
        "Its author, course or task cannot be identified reliably.",
        "The work cannot yet be attributed with confidence.",
      ],
      question:
        "What is enough to associate this work with a learner and task?",
      choices: [
        "Ask for corroborating evidence before attribution.",
        "Allow an authorized, documented manual identification.",
      ],
      facts: [
        "Original evidence",
        "Candidate learners and tasks",
        "Who verified the association",
      ],
    },
  ),
  scenario(
    "records",
    "learn",
    "exception",
    ["Participation", "Deadlines", "Submission rules"],
    {
      id: "cannot-study-or-submit",
      title: "Tools or access fail near a deadline",
      flow: [
        "A learner is preparing or submitting an assignment.",
        "The course, repository or assessment tool becomes unavailable.",
        "The learner may be unable to meet the agreed deadline.",
      ],
      question:
        "What establishes an outage exception and an acceptable alternative hand-in?",
      choices: [
        "Extend affected deadlines using verified outage evidence.",
        "Offer a declared alternative submission channel.",
      ],
      facts: [
        "Outage interval and affected users",
        "Work ready before the cutoff",
        "Alternative instructions",
      ],
    },
  ),
  scenario("records", "change", "exception", ["Records", "Assessment"], {
    id: "source-edited-or-deleted",
    title: "Evidence is edited or disappears after assessment",
    flow: [
      "A submission or message supports a decision.",
      "The author edits it, deletes it or removes reviewer access.",
      "The original basis for the decision is no longer directly visible.",
    ],
    question:
      "What historical evidence may be retained, and what can still be relied on?",
    choices: [
      "Use a permitted retained record of the assessed evidence.",
      "Request replacement evidence and review the affected decision.",
    ],
    facts: [
      "What was originally assessed",
      "Later edits or deletion",
      "Retention and access rules",
    ],
  }),
  scenario(
    "records",
    "change",
    "exception",
    ["Records", "Deadlines", "Assignments"],
    {
      id: "ambiguous-message",
      title: "A clarification is ambiguous or unauthorized",
      flow: [
        "A chat message says Next week is fine for everyone.",
        "Its task, group, exact date or author's authority is unclear.",
        "Learners may interpret it as permission to delay or skip work.",
      ],
      question:
        "What must be clarified before the message changes anyone's obligations?",
      choices: [
        "Ask an authorized person to confirm date, scope and intent.",
        "Keep it as contextual information until formal instructions change.",
      ],
      facts: [
        "Original message and context",
        "Author's authority",
        "Affected task, learners and exact date",
      ],
    },
  ),

  scenario(
    "completion",
    "learn",
    "routine",
    ["Assignments", "Track", "Completion"],
    {
      id: "extra-work",
      title: "A learner completes more than the assigned track",
      flow: [
        "A learner needs only part of the course to finish.",
        "They also complete optional or unassigned activities.",
        "Required completion and extra learning describe different achievements.",
      ],
      question:
        "Does extra work change the required total, earn bonus credit or stay separate?",
      choices: [
        "Recognize extra learning separately from required completion.",
        "Let approved extra work replace or extend requirements under a stated rule.",
      ],
      facts: [
        "Required plan at the time",
        "Extra activities and results",
        "Bonus or substitution rules",
      ],
      related: ["track-only", "required-work-removed"],
    },
  ),
  scenario(
    "completion",
    "change",
    "change",
    ["Assignments", "Track", "Completion"],
    {
      id: "required-work-removed",
      title: "Required work is removed or new work is added",
      flow: [
        "A learner has completed four of six required practices.",
        "The plan removes two practices or adds new ones.",
        "The completion percentage can change without new learning activity.",
      ],
      question:
        "How should a changed requirement total be explained, especially after apparent completion?",
      choices: [
        "Evaluate against the current agreed plan and explain the change.",
        "Keep an earlier completion agreement and treat additions separately.",
      ],
      facts: [
        "Old and new required totals",
        "Effective change date",
        "Any completion already confirmed",
      ],
    },
  ),
  scenario("completion", "finish", "exception", ["Assessment", "Completion"], {
    id: "work-done-review-pending",
    title: "All work is submitted; a final decision is pending",
    flow: [
      "Every required activity has a submission.",
      "Some reviews, grades or an appeal are still open.",
      "The learner has finished submitting but may not yet have earned completion.",
    ],
    question:
      "What status should the learner have while waiting for a final decision?",
    choices: [
      "Show submitted work separately from confirmed completion.",
      "Allow a provisional completion under explicit conditions.",
    ],
    facts: [
      "Outstanding decisions",
      "Published completion rules",
      "Expected review time",
    ],
  }),
  scenario(
    "completion",
    "finish",
    "change",
    ["Version", "Completion", "Assessment"],
    {
      id: "new-version-after-completion",
      title: "A new version arrives after course completion",
      flow: [
        "A learner completed the course under an earlier version.",
        "A later edition adds a required skill or expires old certification.",
        "Historical achievement and current qualification may differ.",
      ],
      question:
        "Is earlier completion permanent, or does qualification require renewal?",
      choices: [
        "Preserve the completed award and offer optional updates.",
        "Require defined renewal work for a time-limited qualification.",
      ],
      facts: [
        "Original completion criteria",
        "Award validity terms",
        "New qualification requirements",
      ],
    },
  ),
  scenario(
    "completion",
    "finish",
    "change",
    ["Version", "Track", "Participation", "Completion"],
    {
      id: "return-for-another-attempt",
      title: "A learner returns after withdrawal, failure or completion",
      flow: [
        "An earlier course attempt has ended.",
        "The learner enrolls again months later.",
        "Earlier evidence exists, but the new attempt may have different requirements.",
      ],
      question:
        "Which parts of the previous attempt are recognized in the new one?",
      choices: [
        "Start a separate attempt with explicitly granted prior credit.",
        "Resume the earlier journey under an agreed continuation plan.",
      ],
      facts: [
        "Reason the earlier attempt ended",
        "Current requirements",
        "Validity of earlier evidence",
      ],
    },
  ),

  scenario(
    "combined",
    "change",
    "exception",
    ["Version", "Track", "Assessment", "Deadlines"],
    {
      id: "change-during-review",
      title: "Version and track change while work is under review",
      flow: [
        "A learner submitted work under v1 and track A.",
        "They move to v2 and track B before a late review finishes.",
        "The result arrives against a plan that is no longer current.",
      ],
      question:
        "Which plan grades the submission, and where can the resulting credit be used?",
      choices: [
        "Assess under the original agreement, then judge credit relevance.",
        "Agree a new assessment basis without silently changing past obligations.",
      ],
      facts: [
        "Plan and rubric at submission",
        "Transition effective time",
        "Review result and target requirements",
      ],
      related: [
        "version-and-track",
        "submitted-before-reviewed-after",
        "rubric-changes",
      ],
    },
  ),
  scenario(
    "combined",
    "change",
    "exception",
    ["Deadlines", "Assignments", "Records"],
    {
      id: "sheet-and-clarification",
      title: "A live sheet update conflicts with a personal extension",
      flow: [
        "A learner has an approved personal extension announced in chat.",
        "A later spreadsheet edit changes group practices and dates.",
        "Both the intended tasks and the applicable deadline may be disputed.",
      ],
      question:
        "Does the later edit override the personal exception, and for which activities?",
      choices: [
        "Retain the scoped exception while reviewing the changed work.",
        "Reconfirm one revised personal plan before enforcing either change.",
      ],
      facts: [
        "Approved extension scope",
        "Sheet changes and effective dates",
        "Authoritative confirmation",
      ],
      related: [
        "personal-extension",
        "sheet-live-edits",
        "conflicting-instructions",
      ],
    },
  ),
  scenario(
    "combined",
    "learn",
    "exception",
    ["Submission rules", "Deadlines", "Records"],
    {
      id: "title-fix-after-cutoff",
      title: "An on-time MR gets a valid title after the cutoff",
      flow: [
        "A learner opens an MR before the deadline with an invalid title.",
        "They correct the title after the deadline without changing the code.",
        "The work time and rule-compliance time differ.",
      ],
      question:
        "Does a naming correction preserve timeliness, and what proves content was unchanged?",
      choices: [
        "Preserve receipt time after verifying the same work.",
        "Use the correction-window rule for invalid hand-ins.",
      ],
      facts: [
        "Original MR time and title",
        "Content revision before the cutoff",
        "Rename time and correction rule",
      ],
      related: ["wrong-mr-title", "mr-renamed", "mr-content-changes"],
    },
  ),
  scenario(
    "combined",
    "change",
    "exception",
    ["Participation", "Version", "Deadlines", "Track"],
    {
      id: "overrun-and-retirement",
      title: "A long-running learner outlives course support",
      flow: [
        "A learner is already past the planned end date.",
        "Their version is retired while they request more time.",
        "Continuing requires both a time agreement and a viable learning path.",
      ],
      question: "Can the old plan be extended, or is a transition necessary?",
      choices: [
        "Extend with access to equivalent supported materials.",
        "Agree a new version, remaining track and revised deadlines together.",
      ],
      facts: [
        "Remaining work and earlier promises",
        "Support retirement date",
        "Available continuation options",
      ],
      related: [
        "longer-than-planned",
        "old-version-retired",
        "pause-and-return",
      ],
    },
  ),
  scenario(
    "combined",
    "change",
    "exception",
    ["Assignments", "Deadlines", "Assessment", "Records"],
    {
      id: "sheet-after-submission",
      title: "The sheet changes after a practice was submitted",
      flow: [
        "A learner hands in an assigned practice on time.",
        "The sheet removes that practice, adds another and moves the deadline.",
        "The new plan does not describe the agreement under which the work was done.",
      ],
      question:
        "What remains owed, and how should earlier work and lateness be judged?",
      choices: [
        "Honor the earlier submission and agree only the remaining changes.",
        "Review the whole transition explicitly, including credit and dates.",
      ],
      facts: [
        "Assignment and deadline at submission",
        "Submitted revision and time",
        "New obligations and their effective date",
      ],
      related: [
        "sheet-live-edits",
        "sheet-deleted-row",
        "required-work-removed",
      ],
    },
  ),
  scenario(
    "combined",
    "finish",
    "exception",
    ["Completion", "Assessment", "Participation", "Records"],
    {
      id: "completion-corrected-after-transfer",
      title: "A result is corrected after completion and group transfer",
      flow: [
        "A learner completed the course and moved to another group or program.",
        "A late correction withdraws credit for a required activity.",
        "Earlier completion has already influenced a later learning decision.",
      ],
      question:
        "Which earlier and later decisions can be reopened, and who must be notified?",
      choices: [
        "Review affected entitlements with an appeal and remediation route.",
        "Apply a declared finality rule while documenting the corrected evidence.",
      ],
      facts: [
        "Original award and dependent decisions",
        "Correction basis",
        "Finality, notification and appeal rules",
      ],
      related: [
        "grade-correction-or-appeal",
        "group-transfer",
        "new-version-after-completion",
      ],
    },
  ),
];

export type ScenarioFilters = {
  group: ScenarioGroup | "all";
  phase: ScenarioPhase | "all";
  dimension: ScenarioDimension | "all";
  kind: ScenarioKind | "all";
  query: string;
};
export const emptyScenarioFilters: ScenarioFilters = {
  group: "all",
  phase: "all",
  dimension: "all",
  kind: "all",
  query: "",
};
export function filterScenarios(filters: ScenarioFilters): Scenario[] {
  const words = filters.query
    .trim()
    .toLocaleLowerCase("uk")
    .split(/\s+/)
    .filter(Boolean);
  return scenarios.filter((s) => {
    const text = searchableText([
      s.id,
      s.title,
      ...s.flow,
      s.question,
      ...s.choices,
      ...s.facts,
      ...s.dimensions,
      scenarioGroups.find((g) => g.id === s.group)!.title,
      scenarioKindLabels[s.kind],
    ]);
    return (
      (filters.group === "all" || s.group === filters.group) &&
      (filters.phase === "all" || s.phase === filters.phase) &&
      (filters.dimension === "all" ||
        s.dimensions.includes(filters.dimension)) &&
      (filters.kind === "all" || s.kind === filters.kind) &&
      words.every((word) => text.includes(word))
    );
  });
}

export const planChangeMatrix = [
  {
    version: "Same version",
    track: "Same track",
    scenario: "steady-course",
    label: "Keep learning",
  },
  {
    version: "Same version",
    track: "New track",
    scenario: "track-only",
    label: "Change requirements",
  },
  {
    version: "New version",
    track: "Same track",
    scenario: "version-only",
    label: "Review content changes",
  },
  {
    version: "New version",
    track: "New track",
    scenario: "version-and-track",
    label: "Review both changes",
  },
] as const;
