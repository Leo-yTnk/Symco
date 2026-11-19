import type { Database } from "../domain/model";
import { createEmptyDatabase } from "../domain/emptyDatabase";
import type { DatabaseRepository } from "./databaseRepository";
import { loadOnboarding } from "./localOnboarding";

const KEY = "symos-database-v2";
const LEGACY_KEY = "symos-database-v1";
const LOCAL_USER = "local-user";

function read(key: string): Database | undefined {
  const database = JSON.parse(
    localStorage.getItem(key) ?? "null",
  ) as Database | null;
  if (database?.version === 1 && Array.isArray(database.projects))
    return database;
}

function cleanLegacy(database: Database, fresh: Database): Database {
  const demoProjects = new Set(["aky-mayo", "puddings", "snack", "personal"]);
  const demoClients = new Set(["aky", "nova"]);
  const realProjects = <T extends { projectId: string }>(records: T[]) =>
    records.filter(({ projectId }) => !demoProjects.has(projectId));
  const userId = (id: string) =>
    ["mariana", "rafael", "carlos"].includes(id) ? LOCAL_USER : id;
  const userIds = (ids: string[]) => [...new Set(ids.map(userId))];
  const projects = database.projects.filter(({ id }) => !demoProjects.has(id));
  const tasks = realProjects(database.tasks).map((task) => ({
    ...task,
    assigneeId: task.assigneeId && userId(task.assigneeId),
  }));
  const taskIds = new Set(tasks.map(({ id }) => id));
  const activities = realProjects(database.activities).map((item) => ({
    ...item,
    actorId: userId(item.actorId),
  }));
  const activityIds = new Set(activities.map(({ id }) => id));

  return {
    ...database,
    users: [
      ...fresh.users,
      ...database.users.filter(
        ({ id }) => userId(id) === id && id !== LOCAL_USER,
      ),
    ],
    workspaces: database.workspaces.map((workspace) => ({
      ...workspace,
      name: workspace.name === "Symco Food Tech" ? "Symco" : workspace.name,
      memberIds: userIds(workspace.memberIds),
    })),
    organizations: database.organizations.filter(
      ({ id }) => id !== "symco-org",
    ),
    clients: database.clients.filter(({ id }) => !demoClients.has(id)),
    projects: projects.map((project) => ({
      ...project,
      clientId:
        project.clientId && !demoClients.has(project.clientId)
          ? project.clientId
          : undefined,
      ownerId: userId(project.ownerId),
      memberIds: userIds(project.memberIds),
      tags: project.tags.filter((id) => id !== "innovation"),
    })),
    members: realProjects(database.members).map((item) => ({
      ...item,
      userId: userId(item.userId),
    })),
    gates: realProjects(database.gates).map((item) => ({
      ...item,
      approverIds: userIds(item.approverIds),
    })),
    tasks,
    subtasks: database.subtasks.filter(({ taskId }) => taskIds.has(taskId)),
    comments: realProjects(database.comments).map((item) => ({
      ...item,
      authorId: userId(item.authorId),
    })),
    attachments: realProjects(database.attachments).map((item) => ({
      ...item,
      createdBy: userId(item.createdBy),
    })),
    approvals: realProjects(database.approvals).map((item) => ({
      ...item,
      requestedBy: userId(item.requestedBy),
      approverIds: userIds(item.approverIds),
    })),
    decisions: realProjects(database.decisions).map((item) => ({
      ...item,
      decidedBy: userId(item.decidedBy),
    })),
    risks: realProjects(database.risks).map((item) => ({
      ...item,
      ownerId: item.ownerId && userId(item.ownerId),
    })),
    milestones: realProjects(database.milestones),
    activities,
    notifications: database.notifications
      .filter(({ activityId }) => activityIds.has(activityId))
      .map((item) => ({ ...item, userId: userId(item.userId) })),
    tags: database.tags.filter(({ id }) => id !== "innovation"),
    qualityRecords: realProjects(database.qualityRecords ?? []).map((item) => ({
      ...item,
      ownerId: userId(item.ownerId),
    })),
    automations: (database.automations ?? []).filter(
      ({ projectId }) => !projectId || !demoProjects.has(projectId),
    ),
  };
}

export const localDatabase: DatabaseRepository = {
  load() {
    const { profile } = loadOnboarding();
    const fresh = createEmptyDatabase({
      id: LOCAL_USER,
      name: profile.name || "Meu perfil",
      email: profile.email,
    });
    try {
      return read(KEY) ?? cleanLegacy(read(LEGACY_KEY) ?? fresh, fresh);
    } catch {
      return fresh;
    }
  },
  save(database) {
    localStorage.setItem(KEY, JSON.stringify(database));
  },
};
