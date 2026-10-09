import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
async function load(entry) {
  const out = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`
  );
}
const { createSeed } = await load("src/domain/seed.ts");
const { applyAutomations } = await load("src/domain/automations.ts");
const rule = {
  id: "rule",
  workspaceId: "symco",
  name: "Revisar conclusão",
  trigger: "task_done",
  action: "request_approval",
  enabled: true,
  runs: 0,
};
test("automations run once per new completion and honor workspace, project and paused rules", () => {
  const previous = createSeed();
  previous.automations = [
    rule,
    { ...rule, id: "foreign", workspaceId: "personal" },
    { ...rule, id: "paused", enabled: false },
    { ...rule, id: "project", projectId: "puddings" },
  ];
  const target = previous.tasks.find(
    (t) => t.projectId === "aky-mayo" && t.status !== "done",
  );
  const next = {
    ...previous,
    tasks: previous.tasks.map((t) =>
      t.id === target.id ? { ...t, status: "done" } : t,
    ),
  };
  const result = applyAutomations(previous, next);
  assert.equal(result.approvals.length, previous.approvals.length + 1);
  assert.equal(result.automations[0].runs, 1);
  assert.equal(result.automations[1].runs, 0);
  assert.equal(result.automations[2].runs, 0);
  assert.equal(result.automations[3].runs, 0);
  const repeated = applyAutomations(result, { ...result });
  assert.equal(repeated.approvals.length, result.approvals.length);
  assert.equal(repeated.automations[0].runs, 1);
});
test("document-triggered review tasks are created only for additions, not edits", () => {
  const previous = createSeed();
  previous.automations = [
    { ...rule, trigger: "document_added", action: "add_review_task" },
  ];
  const added = {
    id: "new-doc",
    projectId: "aky-mayo",
    title: "Evidência",
    type: "PDF",
    createdAt: new Date().toISOString(),
    createdBy: "mariana",
  };
  const result = applyAutomations(previous, {
    ...previous,
    attachments: [...previous.attachments, added],
  });
  assert.equal(result.tasks.length, previous.tasks.length + 1);
  assert.equal(result.tasks.at(-1).status, "todo");
  const edited = applyAutomations(result, {
    ...result,
    attachments: result.attachments.map((d) =>
      d.id === added.id ? { ...d, title: "Renomeado" } : d,
    ),
  });
  assert.equal(edited.tasks.length, result.tasks.length);
  assert.equal(edited.automations[0].runs, 1);
});
