import { useCallback, useRef, useState } from "react";
import type {
  Activity,
  Attachment,
  QualityRecord,
  Automation,
  Workspace,
  ApprovalStatus,
  Database,
  Decision,
  Risk,
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
  const undoSnapshot = useRef<Database>();
  const [operation, setOperation] = useState<{
    message: string;
    pending: boolean;
    canUndo?: boolean;
  } | null>(null);
  const actorId = database.users[0].id;
  const commit = useCallback(
    async (
      update: (current: Database) => Database,
      feedback?: { pending: string; success: string },
      undo = false,
    ) => {
      if (saving.current) {
        setError("Aguarde o salvamento em andamento e tente de novo.");
        return false;
      }
      saving.current = true;
      if (feedback) setOperation({ message: feedback.pending, pending: true });
      try {
        const previous = currentDatabase.current;
        const updated = update(previous);
        const next = undo ? updated : applyAutomations(previous, updated);
        await repository.save(next);
        currentDatabase.current = next;
        setDatabase(next);
        setError("");
        setConflict(false);
        // A snapshot is only safe to restore until the next successful save.
        undoSnapshot.current = feedback && !undo ? previous : undefined;
        setOperation(
          feedback
            ? {
                message: feedback.success,
                pending: false,
                canUndo: !undo,
              }
            : null,
        );
        return true;
      } catch (cause) {
        const conflicted = cause instanceof DatabaseConflict;
        setConflict(conflicted);
        if (conflicted) undoSnapshot.current = undefined;
        if (feedback || conflicted)
          setOperation(
            undoSnapshot.current
              ? {
                  message: "A alteração anterior ainda pode ser desfeita.",
                  pending: false,
                  canUndo: true,
                }
              : null,
          );
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
    operation,
    dismissOperation() {
      undoSnapshot.current = undefined;
      setOperation(null);
    },
    undoOperation() {
      const snapshot = undoSnapshot.current;
      if (snapshot)
        return commit(
          () => snapshot,
          {
            pending: "Desfazendo alteração…",
            success: "Alteração desfeita.",
          },
          true,
        );
    },
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
      return commit(
        (current) => {
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
        },
        { pending: "Salvando tarefa…", success: "Tarefa atualizada." },
      );
    },
    deleteTask(taskId: string) {
      return commit(
        (current) => {
          const task = current.tasks.find((item) => item.id === taskId);
          if (!task) return current;
          const project = current.projects.find(
            (item) => item.id === task.projectId,
          )!;
          return {
            ...current,
            tasks: current.tasks
              .filter((item) => item.id !== taskId)
              .map((item) =>
                item.dependencyIds.includes(taskId)
                  ? {
                      ...item,
                      dependencyIds: item.dependencyIds.filter(
                        (id) => id !== taskId,
                      ),
                    }
                  : item,
              ),
            subtasks: current.subtasks.filter((item) => item.taskId !== taskId),
            comments: current.comments.filter((item) => item.taskId !== taskId),
            activities: [
              activity(
                project,
                "task_deleted",
                `removeu ${task.title}`,
                taskId,
              ),
              ...current.activities,
            ],
          };
        },
        { pending: "Apagando tarefa…", success: "Tarefa apagada." },
      );
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
      return commit(
        (current) => ({
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
        }),
        { pending: "Salvando documento…", success: "Documento atualizado." },
      );
    },
    deleteDocument(documentId: string) {
      return commit(
        (current) => ({
          ...current,
          attachments: current.attachments.filter(
            (item) => item.id !== documentId,
          ),
          decisions: current.decisions.map((item) =>
            item.attachmentIds.includes(documentId)
              ? {
                  ...item,
                  attachmentIds: item.attachmentIds.filter(
                    (id) => id !== documentId,
                  ),
                }
              : item,
          ),
        }),
        { pending: "Apagando documento…", success: "Documento apagado." },
      );
    },
    saveQuality(input: Omit<QualityRecord, "id">, recordId?: string) {
      return commit(
        (current) => ({
          ...current,
          qualityRecords: recordId
            ? (current.qualityRecords || []).map((r) =>
                r.id === recordId ? { ...input, id: recordId } : r,
              )
            : [...(current.qualityRecords || []), { ...input, id: id() }],
        }),
        recordId
          ? { pending: "Salvando registro…", success: "Registro atualizado." }
          : undefined,
      );
    },
    deleteQuality(recordId: string) {
      return commit(
        (current) => ({
          ...current,
          qualityRecords: (current.qualityRecords || []).filter(
            (item) => item.id !== recordId,
          ),
        }),
        { pending: "Apagando registro…", success: "Registro apagado." },
      );
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
    updateRisk(
      recordId: string,
      changes: Pick<
        Risk,
        | "title"
        | "description"
        | "status"
        | "impact"
        | "probability"
        | "mitigation"
      >,
    ) {
      return commit(
        (current) => ({
          ...current,
          risks: current.risks.map((item) =>
            item.id === recordId ? { ...item, ...changes } : item,
          ),
        }),
        { pending: "Salvando risco…", success: "Risco atualizado." },
      );
    },
    deleteRisk(recordId: string) {
      return commit(
        (current) => ({
          ...current,
          risks: current.risks.filter((item) => item.id !== recordId),
        }),
        { pending: "Apagando risco…", success: "Risco apagado." },
      );
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
    updateDecision(
      recordId: string,
      changes: Pick<Decision, "title" | "description">,
    ) {
      return commit(
        (current) => ({
          ...current,
          decisions: current.decisions.map((item) =>
            item.id === recordId ? { ...item, ...changes } : item,
          ),
        }),
        { pending: "Salvando decisão…", success: "Decisão atualizada." },
      );
    },
    deleteDecision(recordId: string) {
      return commit(
        (current) => ({
          ...current,
          decisions: current.decisions.filter((item) => item.id !== recordId),
        }),
        { pending: "Apagando decisão…", success: "Decisão apagada." },
      );
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
