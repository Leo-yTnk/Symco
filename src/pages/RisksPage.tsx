import { AlertTriangle, ArrowUpRight, GitPullRequestArrow, Scale } from 'lucide-react'
import { useState } from 'react'
import { risks } from '../data'
import { StatusBadge } from '../components/ui'

type RiskTab = 'Todos' | 'Risco' | 'Decisão' | 'Mudança'

export function RisksPage() {
  const [tab, setTab] = useState<RiskTab>('Todos')
  const filtered = risks.filter(risk => tab === 'Todos' || risk[1] === tab)
  return <div className="page-stack risks-page"><section className="risk-overview"><article className="risk-matrix"><div className="matrix-label">IMPACTO</div><div className="matrix-grid"><span /><span /><span className="warm" /><span /><span className="warm" /><span className="hot"><b>3</b></span><span /><span /><span /></div><small>PROBABILIDADE →</small></article><article className="risk-summary"><span className="eyebrow">PULSO DO PROJETO</span><strong>3 itens exigem tratamento</strong><p>Os riscos regulatório e fabril podem impedir o avanço para aprovação do cliente.</p><div><span><AlertTriangle size={16} /> 3 críticos</span><span><Scale size={16} /> 1 decisão</span><span><GitPullRequestArrow size={16} /> 1 mudança</span></div></article></section><section className="card registry"><div className="registry-head"><div className="tabs">{(['Todos', 'Risco', 'Decisão', 'Mudança'] as RiskTab[]).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div><small>{filtered.length} itens no registro</small></div><div className="risk-list">{filtered.map(risk => <article key={risk[0]}><span className="risk-code">{risk[0]}<small>{risk[1]}</small></span><div><span className="gate-pill">{risk[2]}</span><h3>{risk[3]}</h3><small>Impacto: {risk[6]}</small></div><StatusBadge status={risk[4]} /><div><small>RESPONSÁVEL</small><strong>{risk[5]}</strong></div><div className="risk-action"><small>RESPOSTA PLANEJADA</small><span>{risk[7]}</span></div><button aria-label={`Abrir ${risk[0]}`}><ArrowUpRight size={17} /></button></article>)}</div></section></div>
}
