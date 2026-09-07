import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, CircleGauge, Clock3, FileText, FlaskConical, ShieldCheck } from 'lucide-react'
import { documents, risks } from '../data'
import { taskClassifications, type BoardGate, type Navigate, type Task, type TaskClassification } from '../types'
import { Metric, Progress, SectionTitle, StatusBadge } from '../components/ui'

export function DashboardPage({ tasks, gates, documentsDone, hours, navigate, openBoardWithClassification }: { tasks: Task[]; gates: BoardGate[]; documentsDone: number; hours: number[]; navigate: Navigate; openBoardWithClassification: (classification: TaskClassification) => void }) {
  const completed = tasks.filter(task => task.status === 'Concluído').length
  const blocked = tasks.filter(task => task.status === 'Bloqueado').length
  const progress = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
  const used = hours.reduce((sum, value) => sum + value, 0)
  const critical = risks.filter(risk => risk[4] === 'Crítica').length
  const nextGate = gates.find(gate => {
    const related = tasks.filter(task => task.gate.includes(gate.id))
    return !related.length || related.some(task => task.progress < 100)
  }) || gates.at(-1)

  return <div className="page-stack dashboard-page">
    <div className="hero-composition">
      <section className="project-brief">
        <div className="brief-main"><h2>Plataforma de Maionese</h2><div className="brief-tags"><span><FlaskConical size={14} /> Food tech</span><span><ShieldCheck size={14} /> {gates.length} decision gates</span></div></div>
        <div className="brief-decision"><span>Próxima decisão</span><strong>{nextGate?.id} · {nextGate?.name}</strong><small>{nextGate?.plannedDate}</small><button onClick={() => navigate('gates')}>Preparar Gate <ArrowUpRight size={15} /></button></div>
        <span className="brief-watermark">sy</span>
      </section>
      <aside className="brief-grid" aria-label="Dados do projeto"><span>Project lead<strong>Patrick Tanaka</strong></span><span>Investimento<strong>R$ 69.900</strong></span><span>Janela do projeto<strong>07 set — 16 nov</strong></span></aside>
    </div>

    <section className="attention-callout"><span className="attention-number">01</span><div><strong>Validar escopo, targets e governança antes da abertura do G0.</strong></div><button onClick={() => navigate('board')}>Ver atividade <ArrowUpRight size={15} /></button></section>

    <section className="sym-filter-links" aria-label="Filtrar Project Board por frente Sym"><div><span>PROJECT BOARD</span><strong>Explorar por frente Sym*</strong></div><nav>{taskClassifications.map(classification => { const count = tasks.filter(task => task.classification === classification).length; return <button key={classification} onClick={() => openBoardWithClassification(classification)}><span>{classification.replace('™', '')}</span><b>{count}</b><ArrowUpRight size={13} /></button> })}</nav></section>

    <section className="metric-grid">
      <Metric icon={CircleGauge} label="Avanço ponderado" value={`${progress}%`} note="Meta de aderência ≥ 90%" />
      <Metric icon={CheckCircle2} label="Atividades concluídas" value={`${completed}/${tasks.length}`} note={`${tasks.filter(t => t.status === 'Em andamento').length} em execução`} tone="success" />
      <Metric icon={AlertTriangle} label="Exceções abertas" value={`${blocked + critical}`} note={`${critical} riscos críticos`} tone="danger" />
      <Metric icon={Clock3} label="Capacidade PMO" value={`${40 - used}h`} note={`${used}h utilizadas de 40h`} tone="violet" />
    </section>

    <section className="card journey-card">
      <SectionTitle title="Jornada de Stage-Gates" action={<button className="text-button" onClick={() => navigate('gates')}>Detalhar jornada <ArrowUpRight size={14} /></button>} />
      <div className="gate-track">{gates.map((gate, index) => {
        const related = tasks.filter(task => task.gate.includes(gate.id))
        const value = related.length ? Math.round(related.reduce((sum, task) => sum + task.progress, 0) / related.length) : 0
        const current = index === 0
        return <div className={`gate-node ${current ? 'current' : ''}`} key={gate.id}><div>{value === 100 ? <Check size={16} /> : gate.id}</div><span>{gate.name}</span><small>{current ? 'Próximo' : `${value}%`}</small>{index < gates.length - 1 && <i />}</div>
      })}</div>
    </section>

    <section className="dashboard-lower">
      <article className="card exception-card"><SectionTitle title="O que exige decisão" action={<button className="text-button" onClick={() => navigate('risks')}>Ver registro</button>} /><div className="exception-list">{risks.slice(0, 3).map((risk, index) => <div key={risk[0]}><span className="exception-rank">0{index + 1}</span><div><strong>{risk[3]}</strong><small>{risk[0]} · {risk[2]} · Dono: {risk[5]}</small></div><StatusBadge status={risk[4]} /></div>)}</div></article>
      <article className="card evidence-card"><SectionTitle title="Prontidão documental" action={<FileText size={18} />} /><div className="evidence-score"><div><strong>{Math.round(documentsDone / documents.length * 100)}%</strong><span>cobertura</span></div><div><Progress value={documentsDone / documents.length * 100} tone="violet" /><strong>{documents.length - documentsDone} pendências</strong><small>Sem evidência, o Gate não avança.</small></div></div><button className="button subtle full" onClick={() => navigate('documents')}>Revisar evidências</button></article>
    </section>
  </div>
}
