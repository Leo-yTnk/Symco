import {
  AlertTriangle, CalendarDays, Clock3, FileText, FolderKanban,
  LayoutDashboard, ShieldCheck, Users,
} from 'lucide-react'
import type { View } from '../types'

export const navigation = [
  ['dashboard', 'Visão geral', LayoutDashboard],
  ['board', 'Project board', FolderKanban],
  ['gates', 'Stage-Gates', ShieldCheck],
  ['schedule', 'Cronograma', CalendarDays],
  ['risks', 'Riscos e decisões', AlertTriangle],
  ['documents', 'Documentos', FileText],
  ['hours', 'Horas PMO', Clock3],
  ['governance', 'Governança', Users],
] as const

export const pageMeta: Record<View, { title: string; description: string }> = {
  dashboard: { title: 'Visão geral', description: 'Decisões, bloqueios e avanço em um único panorama.' },
  board: { title: 'Project board', description: 'Atividades organizadas por etapa e prioridade.' },
  gates: { title: 'Stage-Gates', description: 'Evidências e critérios que liberam cada avanço.' },
  schedule: { title: 'Cronograma', description: 'Marcos, dependências e caminho até o lançamento.' },
  risks: { title: 'Riscos e decisões', description: 'Sinais críticos, responsáveis e respostas planejadas.' },
  documents: { title: 'Documentos', description: 'Artefatos necessários para aprovar cada Gate.' },
  hours: { title: 'Horas PMO', description: 'Consumo, saldo e tendência do esforço contratado.' },
  governance: { title: 'Governança', description: 'Papéis, decisões e cadência de acompanhamento.' },
  settings: { title: 'Configurações', description: 'Personalize o SymOS para trabalhar do seu jeito.' },
}

export const statuses = ['Não iniciado', 'Em andamento', 'Bloqueado', 'Concluído', 'Cancelado'] as const
