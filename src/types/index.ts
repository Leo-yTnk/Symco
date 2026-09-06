export type View = 'dashboard' | 'board' | 'gates' | 'schedule' | 'risks' | 'documents' | 'hours' | 'governance' | 'settings'

export type UserPreferences = {
  sidebarWidth: number
  accent: 'cyan' | 'violet' | 'emerald'
  density: 'comfortable' | 'compact'
  motion: 'full' | 'reduced'
}

export type TaskStatus = 'Não iniciado' | 'Em andamento' | 'Bloqueado' | 'Concluído' | 'Cancelado'

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
}

export type Navigate = (view: View) => void
