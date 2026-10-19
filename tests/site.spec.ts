import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const sections = [
  "concepts",
  "ecosystems",
  "data",
  "versions",
  "statistics",
  "mvp",
  "simulation",
];
test("all visual chapters load without browser errors or page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const section of sections) {
    await page.goto("/#" + section);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("22 terms follow the learning hierarchy and diagrams support keyboard exploration", async ({
  page,
}) => {
  await page.goto("/#concepts");
  await expect(page.locator(".concept-chips button")).toHaveCount(22);
  await page
    .locator(".concept-chips")
    .first()
    .getByRole("button", { name: "Theory", exact: true })
    .click();
  await expect(page.locator(".concept-inspector")).toContainText(
    "Learning material a student needs to study",
  );
  await page
    .getByRole("button", { name: "How a result appears", exact: true })
    .click();
  const node = page
    .locator(".graph-node[role=button]")
    .filter({ hasText: "Student record" });
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".compact-inspector").first()).toContainText(
    "One person's linked course data",
  );
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.locator(".graph-toolbar")).toContainText("110%");
  await page.getByRole("textbox", { name: "Find a term" }).fill("Manifest");
  await expect(page.locator(".concept-chips button")).toHaveCount(1);
  await page.goto("/#glossary/learning-plan");
  await expect(page.locator(".concept-inspector")).toContainText(
    "Learning track",
  );
});
test("exactly seven global systems expose separate collection, version and track flows", async ({
  page,
}) => {
  await page.goto("/#ecosystems");
  await expect(page.locator(".graph-node")).toHaveCount(7);
  await expect(page.locator(".graph-node.is-inactive")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Course type", exact: true })
    .selectOption("java");
  await expect(page.locator(".graph-node.is-inactive")).toHaveCount(0);
  await page
    .locator(".graph-node")
    .filter({ hasText: "GitLab · students" })
    .click();
  await expect(page.locator(".concept-inspector")).toContainText(
    "Merging an MR does not automatically award activity credit",
  );
  await page
    .getByRole("button", { name: "Change version", exact: true })
    .click();
  await expect(page.locator(".graph-shell")).toContainText(
    "migration decision",
  );
  await page.getByRole("button", { name: "Assign track", exact: true }).click();
  await expect(page.locator(".graph-shell")).toContainText(
    "proposed clarification",
  );
  await page.goto("/#data");
  await expect(
    page
      .locator(".source-controls")
      .getByRole("button", { name: "Discord", exact: true }),
  ).toBeVisible();
});
test("ingestion shows formats, suppresses duplicates, preserves records on outage, and routes unresolved identities", async ({
  page,
}) => {
  await page.goto("/#data");
  await page
    .getByRole("combobox", { name: "Course type", exact: true })
    .selectOption("java");
  await page
    .getByRole("button", { name: "Receive record", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Receive record", exact: true })
    .click();
  await expect(page.getByTestId("unique-facts")).toHaveText("1");
  await expect(page.getByTestId("duplicates")).toHaveText("1");
  await page.getByRole("checkbox", { name: "Source unavailable" }).check();
  await page
    .getByRole("button", { name: "Receive record", exact: true })
    .click();
  await expect(page.getByTestId("unique-facts")).toHaveText("1");
  await expect(page.getByRole("status")).toContainText(
    "Previous facts are retained",
  );
  await page
    .getByRole("checkbox", { name: "Account could not be linked" })
    .check();
  await expect(page.locator(".intake-counters")).toContainText("Review queue");
  await page.getByRole("button", { name: "Confirm link", exact: true }).click();
  await expect(page.locator(".intake-counters")).toContainText(
    "Completion evidence",
  );
  await page
    .locator(".source-controls")
    .getByRole("button", { name: "Sheets · assignments", exact: true })
    .click();
  await expect(page.locator(".intake-counters")).toContainText(
    "Proposed track",
  );
  await page.getByRole("button", { name: /Manual pilot/ }).click();
  await expect(page.locator(".json-panel pre")).toContainText(
    "row_id,group,activity_id",
  );
});
test("first-start pinning, manual migration, partial delivery and shared statistics retain history", async ({
  page,
}) => {
  await page.goto("/#versions");
  const start = page.getByRole("button", {
    name: "New student's first / repeat activity",
  });
  await start.click();
  await page
    .getByRole("button", { name: "Publish v3 in the start example" })
    .click();
  await start.click();
  await expect(page.getByText("Pinned v2", { exact: true })).toBeVisible();
  await expect(page.getByTestId("old-version")).toHaveText("Pinned v1");
  await page
    .getByRole("checkbox", { name: "Delivery component unavailable" })
    .check();
  await expect(
    page.getByText("Do not launch the lesson", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", {
      name: "Verified cache of the current pin exists",
    })
    .check();
  await expect(
    page.getByText("Open course-v1/index.html", { exact: true }),
  ).toBeVisible();
  const apply = page.getByRole("button", { name: "Approve manual migration" });
  await expect(apply).toBeDisabled();
  await page
    .getByRole("checkbox", {
      name: "Authorized instructor approved migration",
    })
    .check();
  await apply.click();
  await expect(page.getByTestId("old-version")).toHaveText("Pinned v3");
  await expect(page.locator(".history-strip")).toContainText("R1 · v1: 4/6");
  await expect(page.locator(".history-strip")).toContainText("Current R2 · v3");
  await page
    .getByRole("checkbox", { name: "GitLab unavailable during delivery" })
    .check();
  await page
    .getByRole("button", { name: "Synchronize GitLab and Moodle" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Moodle updated. GitLab unavailable",
  );
  await expect(page.locator(".json-panel")).toContainText(
    '"projection_revision": 1',
  );
  await page
    .getByRole("checkbox", { name: "GitLab unavailable during delivery" })
    .uncheck();
  await page
    .getByRole("button", { name: "Synchronize GitLab and Moodle" })
    .click();
  await expect(page.locator(".json-panel")).toContainText(
    '"projection_revision": 2',
  );
  await page.locator(".history-strip").getByRole("link").click();
  await expect(page.getByTestId("student-card")).toContainText("v3 · R2");
  await expect(page.getByTestId("report-progress")).toHaveText("33.3%");
});
test("automatic migration needs an enabled policy, complete mapping and fresh facts", async ({
  page,
}) => {
  await page.goto("/#versions");
  await page
    .getByRole("combobox", { name: "Migration mode" })
    .selectOption("auto");
  const apply = page.getByRole("button", {
    name: "Run automatic migration",
  });
  await page
    .getByRole("checkbox", { name: "Course owner enabled automatic policy" })
    .check();
  await expect(apply).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Allow repeated and new assignments" })
    .check();
  await expect(apply).toBeEnabled();
  for (const name of [
    "Manifest mapping is incomplete",
    "Student data is stale",
  ]) {
    await page.getByRole("checkbox", { name }).check();
    await expect(apply).toBeDisabled();
    await page.getByRole("checkbox", { name }).uncheck();
  }
  await apply.click();
  await expect(page.getByTestId("old-version")).toHaveText("Pinned v3");
  await page.getByText("Decision audit · 1", { exact: true }).click();
  await expect(
    page
      .locator(".reference")
      .filter({ hasText: "Decision audit" })
      .locator("pre"),
  ).toContainText("policy@1");
});
test("a migration opened from statistics changes only the selected student", async ({
  page,
}) => {
  await page.goto("/#statistics");
  await page
    .getByRole("combobox", { name: "Course type", exact: true })
    .selectOption("java");
  await page
    .getByRole("combobox", { name: "Student", exact: true })
    .selectOption("S-2");
  await page
    .getByTestId("student-card")
    .getByRole("link", { name: "Compare and migrate version →" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Student to migrate" }),
  ).toHaveValue("S-2");
  await page
    .getByRole("checkbox", {
      name: "Authorized instructor approved migration",
    })
    .check();
  await page.getByRole("button", { name: "Approve manual migration" }).click();
  await page.locator(".history-strip").getByRole("link").click();
  await expect(
    page.getByRole("combobox", { name: "Student", exact: true }),
  ).toHaveValue("S-2");
  await expect(page.getByTestId("student-card")).toContainText("v3 · R2");
  await page
    .getByRole("combobox", { name: "Student", exact: true })
    .selectOption("S-1");
  await expect(page.getByTestId("student-card")).toContainText("v1 · R1");
});
test("track assignment and confirmed Discord deadlines update the same student card", async ({
  page,
}) => {
  await page.goto("/#data");
  await page
    .getByRole("combobox", { name: "Course type", exact: true })
    .selectOption("java");
  const apply = page.getByRole("button", {
    name: "Apply track to Student 01",
  });
  await expect(apply).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Instructor approved the assignment" })
    .check();
  await apply.click();
  await expect(page.getByTestId("shared-track")).toContainText("4 required");
  await page
    .getByRole("button", { name: "Confirm for Student 01 · group A" })
    .click();
  await page.getByTestId("shared-track").getByRole("link").click();
  await expect(page.getByTestId("student-card")).toContainText("v1 · R3");
  await expect(page.locator(".metric-card").first()).toContainText("/ 4");
  await expect(
    page.locator("tbody tr").filter({ hasText: "TASK-01" }).first(),
  ).toContainText("10-22 20:59");
});
test("student and group reports derive from course plans and MR acceptance is a separate action", async ({
  page,
}) => {
  await page.goto("/#statistics");
  await expect(
    page.getByRole("button", { name: "Group", exact: true }),
  ).toBeDisabled();
  await page
    .locator(".mode-cards")
    .getByRole("button", { name: /Java Dual/ })
    .click();
  const before = await page.getByTestId("report-progress").textContent();
  await page.getByRole("button", { name: "1. Confirm link" }).click();
  await expect(page.getByTestId("report-progress")).toHaveText(before!);
  await page.getByRole("button", { name: "2. Accept submission" }).click();
  await expect(page.getByTestId("report-progress")).not.toHaveText(before!);
  await page.getByRole("button", { name: "Group", exact: true }).click();
  await expect(page.locator(".metric-card").first()).toContainText("/ 90");
  await page
    .getByRole("combobox", { name: "Group", exact: true })
    .selectOption("B");
  await expect(page.locator(".metric-card").first()).toContainText("/ 105");
  await expect(page.locator(".student-bars>div")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Status filter" })
    .selectOption("unknown");
  await expect(
    page.locator(".table-scroll").last().locator("tbody tr"),
  ).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Activity ordering" })
    .selectOption("due");
  await page
    .locator(".table-scroll")
    .first()
    .getByRole("button", { name: "Open student →" })
    .first()
    .click();
  await expect(page.locator(".student-bars>div")).toHaveCount(1);
  await page.getByRole("button", { name: "Course", exact: true }).click();
  await expect(page.locator(".student-bars>div")).toHaveCount(6);
  await expect(page.locator(".metric-card").first()).toContainText("/ 195");
  await expect(page.locator(".metric-card").nth(1)).toContainText("By version");
  await expect(page.getByTestId("student-card")).toContainText(
    "4 need a decision",
  );
});
test("MVP steps expose their outcome and original materials remain accessible", async ({
  page,
  request,
}) => {
  await page.goto("/#mvp");
  await page
    .locator(".mvp-staircase button")
    .filter({ hasText: "Migrations" })
    .click();
  await expect(
    page.getByRole("heading", { name: "MVP 5 · Controlled migrations" }),
  ).toBeVisible();
  await page.locator("footer summary").click();
  for (const a of await page.locator("footer details a").all()) {
    expect((await request.get((await a.getAttribute("href"))!)).ok()).toBe(
      true,
    );
  }
});
test("mobile navigation works", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Mobile menu only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: /How data flows/ })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Follow a single record",
  );
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
test("all chapters pass automated WCAG A/AA checks and use local assets only", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!["localhost", "127.0.0.1"].includes(new URL(r.url()).hostname))
      external.push(r.url());
  });
  for (const section of sections) {
    await page.goto("/#" + section);
    await page.evaluate(() => document.fonts.ready);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(audit.violations, section).toEqual([]);
  }
  expect(external).toEqual([]);
});
