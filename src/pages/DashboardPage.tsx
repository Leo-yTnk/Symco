import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, CircleGauge, Clock3, FileText, FlaskConical, ShieldCheck } from 'lucide-react'
import { documents, gates, risks } from '../data'
import type { Navigate, Task } from '../types'
import { Metric, Progress, SectionTitle, StatusBadge } from '../components/ui'

export function DashboardPage({ tasks, documentsDone, hours, navigate }: { tasks: Task[]; documentsDone: number; hours: number[]; navigate: Navigate }) {
  const completed = tasks.filter(task => task.status === 'Concluído').length
  const blocked = tasks.filter(task => task.status === 'Bloqueado').length
  const progress = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
  const used = hours.reduce((sum, value) => sum + value, 0)
  const critical = risks.filter(risk => risk[4] === 'Crítica').length

  return <div className="page-stack dashboard-page">
    <section className="project-brief">
      <div className="brief-main"><span className="eyebrow inverse">SYMOS · DESENVOLVIMENTO INTEGRADO</span><h2>Plataforma de Maionese</h2><p>Da inteligência de mercado à validação industrial, com rastreabilidade de cada decisão.</p><div className="brief-tags"><span><FlaskConical size={14} /> Food tech</span><span><ShieldCheck size={14} /> 8 decision gates</span></div></div>
      <div className="brief-decision"><span>PRÓXIMA DECISÃO</span><strong>G0 · Brief</strong><small>09 set 2026</small><button onClick={() => navigate('gates')}>Preparar Gate <ArrowUpRight size={15} /></button></div>
      <div className="brief-grid"><span>Project lead<strong>Patrick Tanaka</strong></span><span>Investimento<strong>R$ 69.900</strong></span><span>Janela do projeto<strong>07 set — 16 nov</strong></span></div>
      <span className="brief-watermark">sy</span>
    </section>

    <section className="attention-callout"><span className="attention-number">01</span><div><small>ATENÇÃO PRIORITÁRIA</small><strong>Validar escopo, targets e governança antes da abertura do G0.</strong></div><button onClick={() => navigate('board')}>Ver atividade <ArrowUpRight size={15} /></button></section>

    <section className="metric-grid">
      <Metric icon={CircleGauge} label="Avanço ponderado" value={`${progress}%`} note="Meta de aderência ≥ 90%" />
      <Metric icon={CheckCircle2} label="Atividades concluídas" value={`${completed}/${tasks.length}`} note={`${tasks.filter(t => t.status === 'Em andamento').length} em execução`} tone="success" />
      <Metric icon={AlertTriangle} label="Exceções abertas" value={`${blocked + critical}`} note={`${critical} riscos críticos`} tone="danger" />
      <Metric icon={Clock3} label="Capacidade PMO" value={`${40 - used}h`} note={`${used}h utilizadas de 40h`} tone="violet" />
    </section>

    <section className="card journey-card">
      <SectionTitle eyebrow="MAPA DE DECISÕES" title="Jornada de Stage-Gates" action={<button className="text-button" onClick={() => navigate('gates')}>Detalhar jornada <ArrowUpRight size={14} /></button>} />
      <div className="gate-track">{gates.map((gate, index) => {
        const related = tasks.filter(task => task.gate.includes(gate[0]))
        const value = related.length ? Math.round(related.reduce((sum, task) => sum + task.progress, 0) / related.length) : 0
        const current = index === 0
        return <div className={`gate-node ${current ? 'current' : ''}`} key={gate[0]}><div>{value === 100 ? <Check size={16} /> : gate[0]}</div><span>{gate[1]}</span><small>{current ? 'Próximo' : `${value}%`}</small>{index < gates.length - 1 && <i />}</div>
      })}</div>
    </section>

    <section className="dashboard-lower">
      <article className="card exception-card"><SectionTitle eyebrow="EXCEÇÕES" title="O que exige decisão" action={<button className="text-button" onClick={() => navigate('risks')}>Ver registro</button>} /><div className="exception-list">{risks.slice(0, 3).map((risk, index) => <div key={risk[0]}><span className="exception-rank">0{index + 1}</span><div><strong>{risk[3]}</strong><small>{risk[0]} · {risk[2]} · Dono: {risk[5]}</small></div><StatusBadge status={risk[4]} /></div>)}</div></article>
      <article className="card evidence-card"><SectionTitle eyebrow="EVIDÊNCIAS" title="Prontidão documental" action={<FileText size={18} />} /><div className="evidence-score"><div><strong>{Math.round(documentsDone / documents.length * 100)}%</strong><span>cobertura</span></div><div><Progress value={documentsDone / documents.length * 100} tone="violet" /><strong>{documents.length - documentsDone} pendências</strong><small>Sem evidência, o Gate não avança.</small></div></div><button className="button subtle full" onClick={() => navigate('documents')}>Revisar evidências</button></article>
    </section>
  </div>
}
