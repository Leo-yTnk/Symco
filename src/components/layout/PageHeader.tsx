import { Plus } from 'lucide-react'
import { pageMeta } from '../../config/navigation'
import type { View } from '../../types'

const actions: Record<View, string> = {
  dashboard: 'Abrir atividade', board: 'Nova atividade', gates: 'Preparar revisão', schedule: 'Adicionar marco',
  risks: 'Registrar item', documents: 'Adicionar evidência', hours: 'Lançar horas', governance: 'Editar governança',
}

export function PageHeader({ view, onAction }: { view: View; onAction?: () => void }) {
  const meta = pageMeta[view]
  return <div className="page-head">
    <div><span className="eyebrow">{meta.eyebrow}</span><div className="page-title-row"><h1>{meta.title}</h1><span className="project-code">PRJ-127</span></div><p>{meta.description}</p></div>
    {onAction && <button className="button primary" onClick={onAction}><Plus size={17} />{actions[view]}</button>}
  </div>
}
