import { useCallback, useRef, useState } from "react";
import type {
  Activity,
  Attachment,
  QualityRecord,
  Automation,
  Workspace,
  ApprovalStatus,
  Database,
  Project,
  Task,
} from "../domain/model";
import { applyAutomations } from "../domain/automations";
import { localDatabase } from "../repositories/localDatabase";
import {
  DatabaseConflict,
  type DatabaseRepository,
} from "../repositories/databaseRepository";

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
type NewProject = Omit<Project, "id" | "createdAt">;
type NewTask = Omit<Task, "id" | "createdAt">;

export function useWorkspace(repository: DatabaseRepository = localDatabase) {
  const [database, setDatabase] = useState<Database>(() => repository.load());
  const currentDatabase = useRef(database);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const saving = useRef(false);
  const actorId = database.users[0].id;
  const commit = useCallback(
    async (update: (current: Database) => Database) => {
      if (saving.current) {
        setError("Aguarde o salvamento em andamento e tente de novo.");
        return false;
      }
      saving.current = true;
      try {
        const previous = currentDatabase.current;
        const next = applyAutomations(previous, update(previous));
        await repository.save(next);
        currentDatabase.current = next;
        setDatabase(next);
        setError("");
        setConflict(false);
        return true;
      } catch (cause) {
        const conflicted = cause instanceof DatabaseConflict;
        setConflict(conflicted);
        setError(
          conflicted
            ? "Os dados mudaram em outra sessão. Recarregue para usar a versão mais recente."
            : "Não foi possível salvar. Verifique a conexão ou o armazenamento e tente de novo.",
        );
        return false;
      } finally {
        saving.current = false;
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
    actorId,
    type,
    summary,
    entityId,
    createdAt: now(),
  });
  return {
    database,
    error,
    conflict,
    dismissError: () => setError(""),
    async createProject(
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
      const saved = await commit((current) => ({
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
      return saved ? project.id : undefined;
    },
    updateProject(projectId: string, changes: Partial<Project>) {
      return commit((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId ? { ...project, ...changes } : project,
        ),
      }));
    },
    createTask(input: NewTask) {
      return commit((current) => {
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
      return commit((current) => {
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
      return commit((current) => {
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
      return commit((current) => {
        const project = current.projects.find((item) => item.id === projectId)!;
        const comment = {
          id: id(),
          projectId,
          taskId,
          authorId: actorId,
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
    addDocument(
      projectId: string,
      title: string,
      url?: string,
      details: Partial<Attachment> = {},
    ) {
      return commit((current) => {
        const project = current.projects.find((item) => item.id === projectId)!;
        const document = {
          ...details,
          id: id(),
          projectId,
          title,
          url,
          type: url ? "Link" : "Registro",
          createdAt: now(),
          createdBy: actorId,
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
    updateDocument(documentId: string, changes: Partial<Attachment>) {
      return commit((current) => ({
        ...current,
        attachments: current.attachments.map((item) =>
          item.id === documentId
            ? {
                ...item,
                ...changes,
                updatedAt: now(),
                id: item.id,
                projectId: item.projectId,
              }
            : item,
        ),
      }));
    },
    saveQuality(input: Omit<QualityRecord, "id">, recordId?: string) {
      return commit((current) => ({
        ...current,
        qualityRecords: recordId
          ? (current.qualityRecords || []).map((r) =>
              r.id === recordId ? { ...input, id: recordId } : r,
            )
          : [...(current.qualityRecords || []), { ...input, id: id() }],
      }));
    },
    saveAutomation(input: Omit<Automation, "id" | "runs">, ruleId?: string) {
      return commit((current) => ({
        ...current,
        automations: ruleId
          ? (current.automations || []).map((r) =>
              r.id === ruleId ? { ...r, ...input } : r,
            )
          : [...(current.automations || []), { ...input, id: id(), runs: 0 }],
      }));
    },
    updateWorkspace(workspaceId: string, changes: Partial<Workspace>) {
      return commit((current) => ({
        ...current,
        workspaces: current.workspaces.map((w) =>
          w.id === workspaceId ? { ...w, ...changes, id: w.id } : w,
        ),
      }));
    },
    requestApproval(
      projectId: string,
      title: string,
      approverIds: string[],
      dueDate?: string,
    ) {
      return commit((current) => ({
        ...current,
        approvals: [
          ...current.approvals,
          {
            id: id(),
            projectId,
            title,
            approverIds,
            requestedBy: actorId,
            status: "pending",
            dueDate,
            createdAt: now(),
          },
        ],
      }));
    },
    updateApproval(approvalId: string, status: ApprovalStatus) {
      return commit((current) => {
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
      return commit((current) => {
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
      return commit((current) => {
        const project = current.projects.find((item) => item.id === projectId)!;
        const decision = {
          id: id(),
          projectId,
          title,
          description,
          decidedBy: actorId,
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
      return commit((current) => ({
        ...current,
        clients: [
          ...current.clients,
          { id: id(), workspaceId, name, contact, status: "active" },
        ],
      }));
    },
    configureIdentity(
      userId: string,
      workspaceId: string,
      name: string,
      email: string,
      organization: string,
      role: string,
    ) {
      return commit((current) => ({
        ...current,
        users: current.users.map((user) =>
          user.id === userId
            ? { ...user, name, email: email || user.email, role, workspaceId }
            : user,
        ),
        workspaces: current.workspaces.map((workspace) =>
          workspace.id === workspaceId
            ? { ...workspace, name: organization }
            : workspace,
        ),
      }));
    },
  };
}
export type WorkspaceActions = ReturnType<typeof useWorkspace>;
