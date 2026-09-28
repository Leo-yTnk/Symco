import type { Module, ProjectTemplate } from "./model";

export const modules: Module[] = [
  {
    id: "insights",
    name: "SymInsights",
    description: "Inteligência e decisões",
    variants: [],
  },
  {
    id: "product",
    name: "SymProduct",
    description: "Desenvolvimento de produto",
    variants: [],
  },
  {
    id: "quality",
    name: "SymQuality",
    description: "Qualidade e conformidade",
    variants: [
      { id: "ra", name: "Regulatório", capabilities: [] },
      { id: "fsq", name: "Food Safety & Quality", capabilities: [] },
    ],
  },
  {
    id: "academy",
    name: "SymAcademy",
    description: "Conhecimento e formação",
    variants: [],
  },
  {
    id: "supply",
    name: "SymSupply",
    description: "Operações e fornecimento",
    variants: [],
  },
  {
    id: "gomarket",
    name: "SymGoMarket",
    description: "Estratégia comercial",
    variants: [],
  },
];

export const templates: ProjectTemplate[] = [
  {
    id: "product",
    name: "Desenvolvimento de Produto",
    description: "Da descoberta ao lançamento.",
    methodologyId: "symco-food",
    moduleIds: ["product", "quality", "insights"],
    tasks: [
      {
        title: "Consolidar briefing e objetivos",
        stageId: "discover",
        priority: "high",
      },
      {
        title: "Validar formulação piloto",
        stageId: "develop",
        priority: "high",
      },
      {
        title: "Revisar requisitos regulatórios",
        stageId: "regulatory",
        priority: "medium",
      },
    ],
  },
  {
    id: "reformulation",
    name: "Reformulação de Receita",
    description: "Aprimore uma linha existente.",
    methodologyId: "symco-food",
    moduleIds: ["product", "quality"],
    tasks: [
      {
        title: "Mapear ingredientes e restrições",
        stageId: "discover",
        priority: "medium",
      },
    ],
  },
  {
    id: "audit",
    name: "Qualidade & Auditoria",
    description: "Evidências, requisitos e aprovação.",
    methodologyId: "symco-food",
    moduleIds: ["quality"],
    tasks: [
      {
        title: "Definir escopo da auditoria",
        stageId: "define",
        priority: "high",
      },
    ],
  },
  {
    id: "market",
    name: "Go-to-Market",
    description: "Planeje a entrada no mercado.",
    methodologyId: "symco-food",
    moduleIds: ["gomarket", "insights"],
    tasks: [
      {
        title: "Definir canais e posicionamento",
        stageId: "define",
        priority: "medium",
      },
    ],
  },
  {
    id: "strategy",
    name: "Planejamento Estratégico",
    description: "Transforme decisões em execução.",
    methodologyId: "simple",
    moduleIds: [],
    tasks: [
      { title: "Documentar objetivos", stageId: "plan", priority: "medium" },
    ],
  },
  {
    id: "blank",
    name: "Projeto em Branco",
    description: "Comece com sua própria estrutura.",
    moduleIds: [],
    tasks: [],
  },
];
