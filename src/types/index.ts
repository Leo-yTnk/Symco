export type View = 'dashboard' | 'board' | 'gates' | 'schedule' | 'risks' | 'documents' | 'hours' | 'governance' | 'settings'

export type UserPreferences = {
  sidebarWidth: number
  accent: 'cyan' | 'violet' | 'emerald'
  theme: 'light' | 'dark'
  density: 'comfortable' | 'compact'
  motion: 'full' | 'reduced'
}

export type TaskStatus = 'Não iniciado' | 'Em andamento' | 'Bloqueado' | 'Concluído' | 'Cancelado'

export const taskClassifications = [
  'SymInsights™', 'SymProduct™', 'SymQuality™ (RA)', 'SymQuality™ (FSQ)',
  'SymAcademy™', 'SymSupply™', 'SymGoMarket™', 'SymPlant™',
] as const
export type TaskClassification = typeof taskClassifications[number]

export type Task = {
  id: string
  module: string
  gate: string
  title: string
  owner: string
  support: string
  start: string
  due: string
  status: TaskStatus
  priority: 'Crítica' | 'Alta' | 'Média'
  progress: number
  plannedHours: number
  actualHours: number
  dependency?: string
  evidence: string
  nextAction: string
  sprintId?: string
  classification?: TaskClassification
}

export type Sprint = {
  id: string
  name: string
  goal: string
  start: string
  end: string
  status: 'Planejada' | 'Ativa' | 'Concluída'
}

export type BoardGate = {
  id: string
  name: string
  description: string
  color: string
  decisionOwner: string
  evidence: string
  plannedDate: string
}

export type Navigate = (view: View) => void
