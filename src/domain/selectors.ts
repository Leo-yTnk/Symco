import type { Database, Project } from "./model";

export const projectTasks = (db: Database, projectId: string) =>
  db.tasks.filter((task) => task.projectId === projectId);
export const progress = (db: Database, projectId: string) => {
  const tasks = projectTasks(db, projectId);
  return tasks.length
    ? Math.round(
        (tasks.filter((task) => task.status === "done").length / tasks.length) *
          100,
      )
    : 0;
};
export const projectClient = (db: Database, project: Project) =>
  db.clients.find((client) => client.id === project.clientId)?.name ||
  "Projeto independente";
export const userName = (db: Database, id?: string) =>
  db.users.find((user) => user.id === id)?.name || "A definir";
export const stageName = (db: Database, project: Project) =>
  db.methodologies
    .find((item) => item.id === project.methodologyId)
    ?.stages.find((item) => item.id === project.currentStageId)?.name ||
  "Sem etapa";
export const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`))
    : "Sem prazo";
export const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
