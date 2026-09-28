import { useCallback, useRef, useState } from "react";
import type {
  Activity,
  ApprovalStatus,
  Database,
  Project,
  Task,
} from "../domain/model";
import {
  localDatabase,
  type DatabaseRepository,
} from "../repositories/localDatabase";

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
type NewProject = Omit<Project, "id" | "createdAt">;
type NewTask = Omit<Task, "id" | "createdAt">;

export function useWorkspace(repository: DatabaseRepository = localDatabase) {
  const [database, setDatabase] = useState<Database>(() => repository.load());
  const currentDatabase = useRef(database);
  const [error, setError] = useState("");
  const commit = useCallback(
    (update: (current: Database) => Database) => {
      // Persist before publishing. Keeping this outside a React state updater avoids
      // duplicate writes when StrictMode replays updater functions in development.
      const next = update(currentDatabase.current);
      try {
        repository.save(next);
        currentDatabase.current = next;
        setDatabase(next);
        setError("");
      } catch {
        setError(
          "Não foi possível salvar. Verifique o armazenamento do navegador.",
        );
      }
    },
    [repository],
  );
  const activity = (
    project: Project,
    type: Activity["type"],
    summary: string,
    entityId?: string,
  ): Activity => ({
    id: id(),
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorId: "mariana",
    type,
    summary,
    entityId,
    createdAt: now(),
  });
  return {
    database,
    error,
    dismissError: () => setError(""),
    createProject(
      input: NewProject,
      tasks: Pick<Task, "title" | "stageId" | "priority">[],
      customStages: string[] = [],
    ) {
      const methodologyId = customStages.length ? id() : input.methodologyId;
      const project: Project = {
        ...input,
        id: id(),
        methodologyId,
        currentStageId: customStages.length ? "custom-0" : input.currentStageId,
        createdAt: now(),
      };
      commit((current) => ({
        ...current,
        methodologies: customStages.length
          ? [
              ...current.methodologies,
              {
                id: methodologyId!,
                workspaceId: project.workspaceId,
                name: `Fluxo de ${project.name}`,
                stages: customStages.map((name, order) => ({
                  id: `custom-${order}`,
                  name,
                  order,
                })),
              },
            ]
          : current.methodologies,
        projects: [...current.projects, project],
        tasks: [
          ...current.tasks,
          ...tasks.map((task) => ({
            ...task,
            stageId: customStages.length ? "custom-0" : task.stageId,
            id: id(),
            projectId: project.id,
            status: "todo" as const,
            dependencyIds: [],
            createdAt: now(),
          })),
        ],
        activities: [
          activity(
            project,
            "project_created",
            `criou o projeto ${project.name}`,
          ),
          ...current.activities,
        ],
      }));
      return project.id;
    },
    updateProject(projectId: string, changes: Partial<Project>) {
      commit((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId ? { ...project, ...changes } : project,
        ),
      }));
    },
    createTask(input: NewTask) {
      commit((current) => {
        const project = current.projects.find(
          (item) => item.id === input.projectId,
        )!;
        const task = { ...input, id: id(), createdAt: now() };
        return {
          ...current,
          tasks: [...current.tasks, task],
          activities: [
            activity(
              project,
              "task_created",
              `criou a tarefa ${task.title}`,
              task.id,
            ),
            ...current.activities,
          ],
        };
      });
    },
    updateTask(taskId: string, changes: Partial<Task>) {
      commit((current) => {
        const previous = current.tasks.find((task) => task.id === taskId);
        if (!previous) return current;
        const project = current.projects.find(
          (item) => item.id === previous.projectId,
        )!;
        return {
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId ? { ...task, ...changes } : task,
          ),
          activities: [
            activity(
              project,
              "task_updated",
              `atualizou ${previous.title}${changes.status ? ` para ${changes.status}` : ""}`,
              taskId,
            ),
            ...current.activities,
          ],
        };
      });
    },
    deleteTask(taskId: string) {
      commit((current) => {
        const task = current.tasks.find((item) => item.id === taskId);
        if (!task) return current;
        const project = current.projects.find(
          (item) => item.id === task.projectId,
        )!;
        return {
          ...current,
          tasks: current.tasks.filter((item) => item.id !== taskId),
          comments: current.comments.filter((item) => item.taskId !== taskId),
          activities: [
            activity(project, "task_deleted", `removeu ${task.title}`, taskId),
            ...current.activities,
          ],
        };
      });
    },
    addComment(projectId: string, body: string, taskId?: string) {
      commit((current) => {
        const project = current.projects.find((item) => item.id === projectId)!;
        const comment = {
          id: id(),
          projectId,
          taskId,
          authorId: "mariana",
          body,
          createdAt: now(),
        };
        return {
          ...current,
          comments: [...current.comments, comment],
          activities: [
            activity(
              project,
              "comment_added",
              `comentou em ${project.name}`,
              comment.id,
            ),
            ...current.activities,
          ],
        };
      });
    },
    addDocument(projectId: string, title: string, url?: string) {
      commit((current) => {
        const project = current.projects.find((item) => item.id === projectId)!;
        const document = {
          id: id(),
          projectId,
          title,
          url,
          type: url ? "Link" : "Registro",
          createdAt: now(),
          createdBy: "mariana",
        };
        return {
          ...current,
          attachments: [...current.attachments, document],
          activities: [
            activity(
              project,
              "document_added",
              `adicionou ${title}`,
              document.id,
            ),
            ...current.activities,
          ],
        };
      });
    },
    updateApproval(approvalId: string, status: ApprovalStatus) {
      commit((current) => {
        const approval = current.approvals.find(
          (item) => item.id === approvalId,
        );
        if (!approval) return current;
        const project = current.projects.find(
          (item) => item.id === approval.projectId,
        )!;
        return {
          ...current,
          approvals: current.approvals.map((item) =>
            item.id === approvalId ? { ...item, status } : item,
          ),
          activities: [
            activity(
              project,
              "approval_updated",
              `alterou aprovação ${approval.title} para ${status}`,
              approvalId,
            ),
            ...current.activities,
          ],
        };
      });
    },
    addRisk(projectId: string, title: string, description: string) {
      commit((current) => {
        const project = current.projects.find((item) => item.id === projectId)!;
        const risk = {
          id: id(),
          projectId,
          title,
          description,
          probability: "medium" as const,
          impact: "medium" as const,
          status: "open" as const,
        };
        return {
          ...current,
          risks: [...current.risks, risk],
          activities: [
            activity(
              project,
              "risk_added",
              `identificou risco: ${title}`,
              risk.id,
            ),
            ...current.activities,
          ],
        };
      });
    },
    addDecision(projectId: string, title: string, description: string) {
      commit((current) => {
        const project = current.projects.find((item) => item.id === projectId)!;
        const decision = {
          id: id(),
          projectId,
          title,
          description,
          decidedBy: "mariana",
          decidedAt: now(),
          attachmentIds: [],
        };
        return {
          ...current,
          decisions: [...current.decisions, decision],
          activities: [
            activity(
              project,
              "decision_added",
              `registrou decisão: ${title}`,
              decision.id,
            ),
            ...current.activities,
          ],
        };
      });
    },
    addClient(workspaceId: string, name: string, contact: string) {
      commit((current) => ({
        ...current,
        clients: [
          ...current.clients,
          { id: id(), workspaceId, name, contact, status: "active" },
        ],
      }));
    },
  };
}
export type WorkspaceActions = ReturnType<typeof useWorkspace>;
