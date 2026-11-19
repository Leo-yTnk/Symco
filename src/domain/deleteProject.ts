import type { Database } from "./model";

export function deleteProject(database: Database, projectId: string): Database {
  const belongsToAnotherProject = (item: { projectId?: string }) =>
    item.projectId !== projectId;
  const taskIds = new Set(
    database.tasks
      .filter((item) => item.projectId === projectId)
      .map(({ id }) => id),
  );
  const documentIds = new Set(
    database.attachments
      .filter((item) => item.projectId === projectId)
      .map(({ id }) => id),
  );
  const removedActivities = new Set(
    database.activities
      .filter((item) => item.projectId === projectId)
      .map(({ id }) => id),
  );
  const keepTask = (id: string) => !taskIds.has(id);
  const keepDocument = (id: string) => !documentIds.has(id);

  return {
    ...database,
    projects: database.projects.filter(({ id }) => id !== projectId),
    members: database.members.filter(belongsToAnotherProject),
    tasks: database.tasks.filter(belongsToAnotherProject).map((task) =>
      task.dependencyIds.every(keepTask)
        ? task
        : {
            ...task,
            dependencyIds: task.dependencyIds.filter(keepTask),
          },
    ),
    subtasks: database.subtasks.filter(({ taskId }) => keepTask(taskId)),
    comments: database.comments.filter(
      (comment) =>
        belongsToAnotherProject(comment) &&
        (!comment.taskId || keepTask(comment.taskId)),
    ),
    attachments: database.attachments.filter(belongsToAnotherProject),
    approvals: database.approvals.filter(belongsToAnotherProject),
    decisions: database.decisions
      .filter(belongsToAnotherProject)
      .map((decision) =>
        decision.attachmentIds.every(keepDocument)
          ? decision
          : {
              ...decision,
              attachmentIds: decision.attachmentIds.filter(keepDocument),
            },
      ),
    risks: database.risks.filter(belongsToAnotherProject),
    gates: database.gates.filter(belongsToAnotherProject).map((gate) =>
      gate.requiredTaskIds.every(keepTask) &&
      gate.requiredDocumentIds.every(keepDocument)
        ? gate
        : {
            ...gate,
            requiredTaskIds: gate.requiredTaskIds.filter(keepTask),
            requiredDocumentIds: gate.requiredDocumentIds.filter(keepDocument),
          },
    ),
    milestones: database.milestones.filter(belongsToAnotherProject),
    activities: database.activities.filter(belongsToAnotherProject),
    notifications: database.notifications.filter(
      ({ activityId }) => !removedActivities.has(activityId),
    ),
    qualityRecords: database.qualityRecords?.filter(belongsToAnotherProject),
    automations: database.automations?.filter(belongsToAnotherProject),
  };
}
