import { modules } from "./catalog";
import type { Database, User } from "./model";

export function createEmptyDatabase(user: User): Database {
  const stages = (ids: string[], names: string[]) =>
    names.map((name, order) => ({ id: ids[order], name, order }));

  return {
    version: 1,
    users: [user],
    workspaces: [
      {
        id: "symco",
        name: "Symco",
        memberIds: [user.id],
        moduleIds: modules.map(({ id }) => id),
      },
      {
        id: "personal",
        name: "Projetos pessoais",
        memberIds: [user.id],
        moduleIds: [],
      },
    ],
    methodologies: [
      {
        id: "symco-food",
        workspaceId: "symco",
        name: "Metodologia Symco Food",
        stages: stages(
          [
            "discover",
            "define",
            "develop",
            "regulatory",
            "quality",
            "approve",
            "scale",
          ],
          [
            "Descobrir",
            "Definir",
            "Desenvolver",
            "Regulatório",
            "Qualidade",
            "Aprovar",
            "Escalar",
          ],
        ),
      },
      {
        id: "simple",
        workspaceId: "personal",
        name: "Projeto simples",
        stages: stages(
          ["plan", "execute", "review"],
          ["Planejar", "Executar", "Revisar"],
        ),
      },
    ],
    organizations: [],
    clients: [],
    projects: [],
    members: [],
    gates: [],
    tasks: [],
    subtasks: [],
    comments: [],
    attachments: [],
    approvals: [],
    decisions: [],
    risks: [],
    milestones: [],
    activities: [],
    notifications: [],
    tags: [],
    qualityRecords: [],
    automations: [],
  };
}
