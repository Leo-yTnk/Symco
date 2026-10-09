import type { Database } from "./model";
// Evaluate only new events from this transaction. Generated tasks are never completed,
// so generated actions cannot recursively trigger another run.
export function applyAutomations(previous: Database, next: Database): Database {
  const completed = next.tasks.filter(
    (t) =>
      t.status === "done" &&
      previous.tasks.find((p) => p.id === t.id)?.status !== "done",
  );
  const documents = next.attachments.filter(
    (d) => !previous.attachments.some((p) => p.id === d.id),
  );
  const result = {
    ...next,
    tasks: [...next.tasks],
    approvals: [...next.approvals],
    activities: [...next.activities],
  };
  result.automations = (next.automations || []).map((rule) => {
    if (!rule.enabled) return rule;
    const events = rule.trigger === "task_done" ? completed : documents;
    const matches = events.filter((e) => {
      const project = next.projects.find((p) => p.id === e.projectId);
      return (
        project?.workspaceId === rule.workspaceId &&
        (!rule.projectId || e.projectId === rule.projectId)
      );
    });
    for (const event of matches) {
      const project = next.projects.find((p) => p.id === event.projectId)!;
      const timestamp = new Date().toISOString();
      const entityId = crypto.randomUUID();
      const title = `${rule.name}: ${event.title}`;
      if (rule.action === "request_approval")
        result.approvals.push({
          id: entityId,
          projectId: project.id,
          title,
          requestedBy: project.ownerId,
          approverIds: [project.ownerId],
          status: "pending",
          createdAt: timestamp,
        });
      else
        result.tasks.push({
          id: entityId,
          projectId: project.id,
          title,
          assigneeId: project.ownerId,
          status: "todo",
          priority: "medium",
          dependencyIds: [],
          createdAt: timestamp,
        });
      result.activities.unshift({
        id: crypto.randomUUID(),
        workspaceId: project.workspaceId,
        projectId: project.id,
        actorId: project.ownerId,
        entityId,
        type: "task_updated",
        summary: `executou a automação ${rule.name}`,
        createdAt: timestamp,
      });
    }
    return matches.length
      ? {
          ...rule,
          runs: rule.runs + matches.length,
          lastRun: new Date().toISOString(),
        }
      : rule;
  });
  return result;
}
