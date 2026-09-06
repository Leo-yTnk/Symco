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

export const pageMeta: Record<View, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: 'CENTRAL DO PROJETO', title: 'Visão geral', description: 'Decisões, bloqueios e avanço em um único panorama.' },
  board: { eyebrow: 'EXECUÇÃO', title: 'Project board', description: 'Atividades organizadas por etapa e prioridade.' },
  gates: { eyebrow: 'FLUXO DE DECISÃO', title: 'Stage-Gates', description: 'Evidências e critérios que liberam cada avanço.' },
  schedule: { eyebrow: 'PLANO INDUSTRIAL', title: 'Cronograma', description: 'Marcos, dependências e caminho até o lançamento.' },
  risks: { eyebrow: 'CONTROLE', title: 'Riscos e decisões', description: 'Sinais críticos, responsáveis e respostas planejadas.' },
  documents: { eyebrow: 'TRILHA DE EVIDÊNCIAS', title: 'Documentos', description: 'Artefatos necessários para aprovar cada Gate.' },
  hours: { eyebrow: 'CAPACIDADE PMO', title: 'Horas PMO', description: 'Consumo, saldo e tendência do esforço contratado.' },
  governance: { eyebrow: 'MODELO OPERACIONAL', title: 'Governança', description: 'Papéis, decisões e cadência de acompanhamento.' },
  settings: { eyebrow: 'PREFERÊNCIAS', title: 'Configurações', description: 'Personalize o SymOS para trabalhar do seu jeito.' },
}

export const statuses = ['Não iniciado', 'Em andamento', 'Bloqueado', 'Concluído', 'Cancelado'] as const
