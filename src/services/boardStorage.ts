import type { BoardGate, Sprint, Task, TaskClassification } from '../types'

const STORAGE_KEY = 'symos-project-board-v1'

export type BoardState = { tasks: Task[]; sprints: Sprint[]; gates: BoardGate[] }

export const defaultSprints: Sprint[] = [
  { id: 'sprint-1', name: 'Sprint 01', goal: 'Alinhar o brief e congelar a arquitetura do produto', start: '07/09/2026', end: '15/09/2026', status: 'Ativa' },
  { id: 'sprint-2', name: 'Sprint 02', goal: 'Validar candidato, requisitos e aprovação do cliente', start: '15/09/2026', end: '24/10/2026', status: 'Planejada' },
  { id: 'sprint-3', name: 'Sprint 03', goal: 'Escalar, liberar e preparar o lançamento', start: '24/10/2026', end: '06/12/2026', status: 'Planejada' },
]

export const toIsoDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const [day, month, year] = value.split('/')
  return `${year}-${month}-${day}`
}

export const toDisplayDate = (value: string) => {
  if (value.includes('/')) return value
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export const taskFitsSprint = (task: Pick<Task, 'start' | 'due'>, sprint: Sprint) =>
  toIsoDate(task.start) >= toIsoDate(sprint.start) && toIsoDate(task.due) <= toIsoDate(sprint.end)

function inferClassification(task: Task): TaskClassification {
  const source = `${task.module} ${task.title}`.toLowerCase()
  if (source.includes('insight') || source.includes('business case') || source.includes('competitivo')) return 'SymInsights™'
  if (source.includes('regulat')) return 'SymQuality™ (RA)'
  if (source.includes('industrial') || source.includes('manufacturing') || source.includes('golden process')) return 'SymPlant™'
  if (source.includes('shelf life') || source.includes('qualidade') || source.includes('checklist')) return 'SymQuality™ (FSQ)'
  if (source.includes('launch') || source.includes('cliente') || source.includes('aky') || source.includes('aprovação')) return 'SymGoMarket™'
  if (source.includes('change control') || source.includes('release')) return 'SymSupply™'
  if (source.includes('kick-off') || source.includes('encerramento') || source.includes('lições')) return 'SymAcademy™'
  return 'SymProduct™'
}

export function hydrateTasks(tasks: Task[], sprints = defaultSprints): Task[] {
  return tasks.map(task => {
    const classification = task.classification || inferClassification(task)
    if (task.sprintId && sprints.some(sprint => sprint.id === task.sprintId && taskFitsSprint(task, sprint))) return { ...task, classification }
    const sprint = sprints.find(item => taskFitsSprint(task, item))
    return { ...task, sprintId: sprint?.id, classification }
  })
}

const recovered = (value: string | undefined, base: string | undefined) => !value || value === 'A definir' ? base || 'A definir' : value

const normalizeGate = (gate: BoardGate, base?: BoardGate): BoardGate => ({
  ...base,
  ...gate,
  decisionOwner: recovered(gate.decisionOwner, base?.decisionOwner),
  evidence: recovered(gate.evidence, base?.evidence),
  plannedDate: recovered(gate.plannedDate, base?.plannedDate),
})

export function loadBoard(fallback: BoardState): BoardState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as BoardState | null
    if (!saved?.tasks?.length || !saved?.sprints?.length || !saved?.gates?.length) return fallback
    return {
      ...saved,
      tasks: hydrateTasks(saved.tasks, saved.sprints),
      gates: saved.gates.map(gate => normalizeGate(gate, fallback.gates.find(base => base.id === gate.id))),
    }
  } catch { return fallback }
}

export function saveBoard(state: BoardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
