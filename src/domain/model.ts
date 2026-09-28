export type ID = string;
export type Role =
  "owner" | "admin" | "project_manager" | "member" | "client" | "viewer";
export type ProjectStatus = "active" | "planning" | "paused" | "completed";
export type TaskStatus = "todo" | "in_progress" | "review" | "blocked" | "done";
export type ApprovalStatus =
  "pending" | "approved" | "rejected" | "changes_requested";
export type HealthStatus = "on_track" | "attention" | "at_risk" | "blocked";
export type User = { id: ID; name: string; email: string };
export type Workspace = {
  id: ID;
  name: string;
  memberIds: ID[];
  moduleIds: ID[];
};
export type Organization = { id: ID; workspaceId: ID; name: string };
export type Client = {
  id: ID;
  workspaceId: ID;
  name: string;
  contact?: string;
  logoUrl?: string;
  status: "active" | "inactive";
};
export type ProjectMember = { projectId: ID; userId: ID; role: Role };
export type Stage = {
  id: ID;
  name: string;
  description?: string;
  order: number;
};
export type Methodology = {
  id: ID;
  workspaceId: ID;
  name: string;
  stages: Stage[];
};
export type Gate = {
  id: ID;
  projectId: ID;
  stageId: ID;
  title: string;
  status: ApprovalStatus;
  dueDate?: string;
  requiredTaskIds: ID[];
  requiredDocumentIds: ID[];
  approverIds: ID[];
  opinion?: string;
};
export type ModuleCapability = { id: ID; label: string };
export type ModuleVariant = {
  id: ID;
  name: string;
  capabilities: ModuleCapability[];
};
export type Module = {
  id: ID;
  name: string;
  description: string;
  variants: ModuleVariant[];
};
export type ProjectTemplate = {
  id: ID;
  name: string;
  description: string;
  methodologyId?: ID;
  moduleIds: ID[];
  tasks: Pick<Task, "title" | "stageId" | "priority">[];
};
export type Project = {
  id: ID;
  workspaceId: ID;
  kind: "symco" | "independent";
  name: string;
  description: string;
  clientId?: ID;
  ownerId: ID;
  memberIds: ID[];
  methodologyId?: ID;
  moduleIds: ID[];
  status: ProjectStatus;
  health: HealthStatus;
  currentStageId?: ID;
  startDate: string;
  dueDate: string;
  favorite?: boolean;
  tags: ID[];
  createdAt: string;
};
export type Task = {
  id: ID;
  projectId: ID;
  title: string;
  description?: string;
  assigneeId?: ID;
  moduleId?: ID;
  stageId?: ID;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  dueDate?: string;
  dependencyIds: ID[];
  createdAt: string;
};
export type Subtask = { id: ID; taskId: ID; title: string; done: boolean };
export type Comment = {
  id: ID;
  projectId: ID;
  taskId?: ID;
  parentId?: ID;
  authorId: ID;
  body: string;
  createdAt: string;
};
export type Attachment = {
  id: ID;
  projectId: ID;
  title: string;
  url?: string;
  type: string;
  createdAt: string;
  createdBy: ID;
};
export type Approval = {
  id: ID;
  projectId: ID;
  title: string;
  requestedBy: ID;
  approverIds: ID[];
  status: ApprovalStatus;
  dueDate?: string;
  createdAt: string;
};
export type Decision = {
  id: ID;
  projectId: ID;
  stageId?: ID;
  title: string;
  description: string;
  decidedBy: ID;
  decidedAt: string;
  attachmentIds: ID[];
};
export type Risk = {
  id: ID;
  projectId: ID;
  title: string;
  description: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  ownerId?: ID;
  status: "open" | "mitigated";
  mitigation?: string;
};
export type Milestone = {
  id: ID;
  projectId: ID;
  title: string;
  dueDate: string;
  status: "pending" | "done";
};
export type Activity = {
  id: ID;
  workspaceId: ID;
  projectId: ID;
  entityId?: ID;
  actorId: ID;
  type:
    | "project_created"
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "comment_added"
    | "approval_updated"
    | "risk_added"
    | "decision_added"
    | "document_added";
  summary: string;
  createdAt: string;
};
export type Notification = {
  id: ID;
  workspaceId: ID;
  userId: ID;
  activityId: ID;
  read: boolean;
};
export type Tag = { id: ID; workspaceId: ID; name: string; color: string };

export type Database = {
  version: 1;
  users: User[];
  workspaces: Workspace[];
  organizations: Organization[];
  clients: Client[];
  projects: Project[];
  members: ProjectMember[];
  methodologies: Methodology[];
  gates: Gate[];
  tasks: Task[];
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  approvals: Approval[];
  decisions: Decision[];
  risks: Risk[];
  milestones: Milestone[];
  activities: Activity[];
  notifications: Notification[];
  tags: Tag[];
};
export const taskStatuses: TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "blocked",
  "done",
];
export const statusLabels: Record<TaskStatus, string> = {
  todo: "Não iniciada",
  in_progress: "Em andamento",
  review: "Em revisão",
  blocked: "Bloqueada",
  done: "Concluída",
};
export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: "Em andamento",
  planning: "Planejamento",
  paused: "Pausado",
  completed: "Concluído",
};
export const healthLabels: Record<HealthStatus, string> = {
  on_track: "No prazo",
  attention: "Atenção",
  at_risk: "Em risco",
  blocked: "Bloqueado",
};
export const approvalLabels: Record<ApprovalStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  changes_requested: "Ajustes solicitados",
};
