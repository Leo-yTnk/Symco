import { useMemo, useState } from 'react'
import {
  AlertTriangle, Bell, CalendarDays, Check, ChevronRight, CircleGauge,
  ClipboardCheck, Clock3, FileText, FolderKanban, HelpCircle, LayoutDashboard, Menu,
  MoreHorizontal, Search, ShieldCheck, SlidersHorizontal, Users, X,
} from 'lucide-react'
import { documents, gates, risks, tasks as initialTasks, weeks, type Task, type TaskStatus } from './data'

type View = 'dashboard' | 'board' | 'gates' | 'schedule' | 'risks' | 'documents' | 'hours' | 'governance'
const statuses: TaskStatus[] = ['Não iniciado','Em andamento','Bloqueado','Concluído','Cancelado']
const nav = [
  ['dashboard','Visão geral',LayoutDashboard],['board','Project board',FolderKanban],['gates','Stage-Gates',ShieldCheck],
  ['schedule','Cronograma',CalendarDays],['risks','Riscos e decisões',AlertTriangle],['documents','Documentos',FileText],
  ['hours','Horas PMO',Clock3],['governance','Governança',Users],
] as const

const headings: Record<View, [string,string]> = {
  dashboard:['Visão geral','Acompanhe o avanço, os bloqueios e as próximas decisões.'],
  board:['Project board','Atualize atividades, responsáveis e evidências em um só lugar.'],
  gates:['Stage-Gates','Avance apenas quando a evidência obrigatória estiver disponível.'],
  schedule:['Cronograma','Veja dependências e marcos do plano de dez semanas.'],
  risks:['Riscos e decisões','Registre sinais críticos antes que afetem prazo, custo ou escopo.'],
  documents:['Documentos e evidências','Controle os arquivos necessários para cada decisão de Gate.'],
  hours:['Horas PMO','Compare a dedicação planejada e realizada por semana.'],
  governance:['Governança','Consulte papéis, rituais e regras de decisão do projeto.'],
}

function App() {
  const [view,setView] = useState<View>('dashboard')
  const [mobileNav,setMobileNav] = useState(false)
  const [tasks,setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask,setSelectedTask] = useState<Task | null>(null)
  const [query,setQuery] = useState('')
  const [statusFilter,setStatusFilter] = useState<TaskStatus | 'Todos'>('Todos')
  const [doneDocuments,setDoneDocuments] = useState<string[]>([])
  const [actualHours,setActualHours] = useState<number[]>(weeks.map(() => 0))
  const [toast,setToast] = useState('')

  const updateTask = (task: Task) => {
    setTasks(current => current.map(item => item.id === task.id ? task : item))
    setSelectedTask(task)
    setToast(`${task.id} atualizado. Os indicadores foram recalculados.`)
    window.setTimeout(() => setToast(''), 2800)
  }
  const openView = (next: View) => { setView(next); setMobileNav(false); window.scrollTo({top:0,behavior:'smooth'}) }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <div className="brand"><span className="brand-mark">sy</span><span><strong>symco.</strong><small>FOOD TECH</small></span></div>
      <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Fechar menu"><X size={20}/></button>
      <div className="project-switcher"><span>PROJETO ATIVO</span><strong>Aky Alimentos</strong><small>Plataforma de Maionese</small></div>
      <nav aria-label="Navegação principal">
        {nav.map(([id,label,Icon]) => <button key={id} className={view===id?'active':''} onClick={() => openView(id)}><Icon size={19}/><span>{label}</span>{view===id&&<ChevronRight size={15}/>}</button>)}
      </nav>
      <div className="sidebar-foot"><div className="avatar">PT</div><span><strong>Patrick Tanaka</strong><small>PMO · Symco</small></span><MoreHorizontal size={18}/></div>
    </aside>
    {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Fechar navegação"/>}
    <div className="workspace">
      <header className="topbar">
        <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu size={21}/></button>
        <div className="global-search"><Search size={17}/><input aria-label="Busca global" placeholder="Buscar atividade, documento ou Gate"/></div>
        <div className="top-actions"><button aria-label="Ajuda"><HelpCircle size={19}/></button><button aria-label="Notificações" className="has-notification"><Bell size={19}/></button><span className="environment">PROTÓTIPO</span></div>
      </header>
      <main>
        <div className="page-head"><div><div className="breadcrumb">Projetos <ChevronRight size={13}/> PRJ-127 <ChevronRight size={13}/> {headings[view][0]}</div><h1>{headings[view][0]}</h1><p>{headings[view][1]}</p></div><div className="page-actions"><button className="button secondary"><MoreHorizontal size={17}/> Mais ações</button><button className="button primary" onClick={() => openView('board')}><FolderKanban size={17}/> Atualizar projeto</button></div></div>
        {view==='dashboard' && <Dashboard tasks={tasks} documentsDone={doneDocuments.length} hours={actualHours} go={openView}/>} 
        {view==='board' && <Board tasks={tasks} query={query} setQuery={setQuery} filter={statusFilter} setFilter={setStatusFilter} select={setSelectedTask}/>} 
        {view==='gates' && <Gates tasks={tasks} doneDocuments={doneDocuments}/>} 
        {view==='schedule' && <Schedule tasks={tasks}/>} 
        {view==='risks' && <Risks/>} 
        {view==='documents' && <Documents done={doneDocuments} setDone={setDoneDocuments}/>} 
        {view==='hours' && <Hours actual={actualHours} setActual={setActualHours}/>} 
        {view==='governance' && <Governance/>}
      </main>
    </div>
    {selectedTask && <TaskDrawer task={selectedTask} close={() => setSelectedTask(null)} save={updateTask}/>} 
    {toast && <div className="toast"><Check size={19}/><span>{toast}</span></div>}
  </div>
}

function StatusBadge({status}:{status:string}) { return <span className={`status status-${status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}`}>{status}</span> }
function Progress({value}:{value:number}) { return <div className="progress" aria-label={`${value}% concluído`}><span style={{width:`${value}%`}}/></div> }

function Dashboard({tasks,documentsDone,hours,go}:{tasks:Task[];documentsDone:number;hours:number[];go:(v:View)=>void}) {
  const completed = tasks.filter(t=>t.status==='Concluído').length
  const blocked = tasks.filter(t=>t.status==='Bloqueado').length
  const progress = Math.round(tasks.reduce((sum,t)=>sum+t.progress,0)/tasks.length)
  const used = hours.reduce((a,b)=>a+b,0)
  const critical = risks.filter(r=>r[4]==='Crítica').length
  return <>
    <section className="project-hero">
      <div><span className="eyebrow">SYMÁGILE™ · PROJETO PRJ-127</span><h2>Aky Alimentos — Plataforma de Maionese</h2><p>Inteligência, desenvolvimento e validação industrial integrados por uma governança única.</p></div>
      <div className="hero-meta"><span>INÍCIO PLANEJADO<strong>07/09/2026</strong></span><span>INVESTIMENTO<strong>R$ 69.900,00</strong></span><span>PROJECT LEAD<strong>Patrick Tanaka</strong></span></div>
      <span className="watermark">sy</span>
    </section>
    <div className="alert-banner"><AlertTriangle size={20}/><div><strong>Kick-off programado para 07/09</strong><span>Valide escopo, targets e governança antes da abertura do G0.</span></div><button onClick={()=>go('gates')}>Revisar Gate <ChevronRight size={16}/></button></div>
    <section className="kpi-grid">
      <Kpi icon={CircleGauge} label="Progresso do projeto" value={`${progress}%`} note="Meta: ≥90% de aderência" tone="info"/>
      <Kpi icon={ClipboardCheck} label="Tarefas concluídas" value={`${completed} de ${tasks.length}`} note={`${tasks.filter(t=>t.status==='Em andamento').length} em andamento`} tone="success"/>
      <Kpi icon={AlertTriangle} label="Pontos críticos" value={`${blocked + critical}`} note={`${blocked} bloqueios · ${critical} riscos críticos`} tone="danger"/>
      <Kpi icon={Clock3} label="Horas PMO" value={`${used}h / 40h`} note={`${40-used}h disponíveis`} tone="governance"/>
    </section>
    <section className="dashboard-grid">
      <div className="card span-2"><div className="card-head"><div><span className="eyebrow dark">AVANÇO DO PROJETO</span><h3>Jornada de Stage-Gates</h3></div><button className="link-button" onClick={()=>go('gates')}>Ver todos</button></div><div className="gate-track">{gates.map((g,i)=>{const gateTasks=tasks.filter(t=>t.gate.includes(g[0]));const value=gateTasks.length?Math.round(gateTasks.reduce((a,t)=>a+t.progress,0)/gateTasks.length):0;return <div className="gate-node" key={g[0]}><div className={value===100?'done':''}>{value===100?<Check size={16}/>:g[0]}</div><span>{g[1]}</span><small>{value}%</small>{i<gates.length-1&&<i/>}</div>})}</div></div>
      <div className="card"><div className="card-head"><div><span className="eyebrow dark">PRÓXIMA DECISÃO</span><h3>Gate 0 · Brief</h3></div><StatusBadge status="Aguardando informação"/></div><div className="decision-body"><div className="date-tile"><span>SET</span><strong>09</strong></div><div><strong>O que será desenvolvido?</strong><p>Project Charter + targets precisam estar validados.</p></div></div><button className="button full" onClick={()=>go('gates')}>Preparar revisão de Gate</button></div>
      <div className="card"><div className="card-head"><div><span className="eyebrow dark">STATUS DAS ATIVIDADES</span><h3>Distribuição atual</h3></div><button className="link-button" onClick={()=>go('board')}>Abrir board</button></div><StatusBars tasks={tasks}/></div>
      <div className="card"><div className="card-head"><div><span className="eyebrow dark">EVIDÊNCIAS</span><h3>Cobertura documental</h3></div><span className="mono muted">{documentsDone}/{documents.length}</span></div><div className="donut-row"><div className="donut" style={{'--progress':`${documentsDone/documents.length*360}deg`} as React.CSSProperties}><span>{Math.round(documentsDone/documents.length*100)}%</span></div><div><strong>{documents.length-documentsDone} documentos pendentes</strong><p>Sem evidência, nenhum Gate avança.</p><button className="link-button" onClick={()=>go('documents')}>Revisar documentos</button></div></div></div>
      <div className="card"><div className="card-head"><div><span className="eyebrow dark">ATENÇÃO HOJE</span><h3>Riscos e dependências</h3></div><button className="link-button" onClick={()=>go('risks')}>Ver registro</button></div><div className="attention-list">{risks.slice(0,3).map(r=><div key={r[0]}><span className="risk-icon"><AlertTriangle size={16}/></span><div><strong>{r[3]}</strong><small><span className="mono">{r[0]}</span> · {r[2]} · {r[5]}</small></div><StatusBadge status={r[4]}/></div>)}</div></div>
    </section>
  </>
}

function Kpi({icon:Icon,label,value,note,tone}:{icon:typeof CircleGauge;label:string;value:string;note:string;tone:string}) { return <div className={`kpi ${tone}`}><span className="kpi-icon"><Icon size={20}/></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div> }
function StatusBars({tasks}:{tasks:Task[]}) { return <div className="status-bars">{statuses.map(s=>{const count=tasks.filter(t=>t.status===s).length;return <div key={s}><span>{s}<b>{count}</b></span><div><i className={`bar-${s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}`} style={{width:`${count/tasks.length*100}%`}}/></div></div>})}</div> }

function Board({tasks,query,setQuery,filter,setFilter,select}:{tasks:Task[];query:string;setQuery:(s:string)=>void;filter:TaskStatus|'Todos';setFilter:(s:TaskStatus|'Todos')=>void;select:(t:Task)=>void}) {
  const filtered=useMemo(()=>tasks.filter(t=>(filter==='Todos'||t.status===filter)&&`${t.id} ${t.title} ${t.owner} ${t.gate}`.toLowerCase().includes(query.toLowerCase())),[tasks,query,filter])
  return <div className="card table-card"><div className="filterbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por atividade, ID ou responsável"/></label><div className="select-wrap"><SlidersHorizontal size={16}/><select value={filter} onChange={e=>setFilter(e.target.value as TaskStatus|'Todos')}><option>Todos</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></div><span className="result-count">{filtered.length} atividades</span></div><div className="table-scroll"><table><thead><tr><th>ID</th><th>Atividade / entrega</th><th>Gate</th><th>Responsável</th><th>Prazo</th><th>Status</th><th>Progresso</th><th></th></tr></thead><tbody>{filtered.map(t=><tr key={t.id} onClick={()=>select(t)} tabIndex={0} onKeyDown={e=>e.key==='Enter'&&select(t)}><td className="mono">{t.id}</td><td><strong>{t.title}</strong><small>{t.module} · {t.evidence}</small></td><td><span className="gate-pill">{t.gate}</span></td><td>{t.owner}</td><td className="mono">{t.due}</td><td><StatusBadge status={t.status}/></td><td><span className="progress-label">{t.progress}%</span><Progress value={t.progress}/></td><td><ChevronRight size={17}/></td></tr>)}</tbody></table></div></div>
}

function TaskDrawer({task,close,save}:{task:Task;close:()=>void;save:(t:Task)=>void}) {
  const [draft,setDraft]=useState(task)
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><section className="drawer" role="dialog" aria-modal="true" aria-labelledby="task-title"><div className="drawer-head"><div><span className="mono eyebrow dark">{task.id} · {task.gate}</span><h2 id="task-title">{task.title}</h2></div><button className="icon-button" onClick={close} aria-label="Fechar"><X size={20}/></button></div><div className="drawer-body"><div className="field-grid"><label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as TaskStatus,progress:e.target.value==='Concluído'?100:draft.progress})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Prioridade<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as Task['priority']})}><option>Crítica</option><option>Alta</option><option>Média</option></select></label></div><label>Progresso <span className="mono">{draft.progress}%</span><input type="range" min="0" max="100" step="5" value={draft.progress} onChange={e=>setDraft({...draft,progress:Number(e.target.value),status:Number(e.target.value)===100?'Concluído':Number(e.target.value)>0?'Em andamento':draft.status})}/></label><div className="detail-list"><div><span>Responsável</span><strong>{task.owner}</strong></div><div><span>Apoio / stakeholders</span><strong>{task.support}</strong></div><div><span>Período</span><strong>{task.start} — {task.due}</strong></div><div><span>Dependência</span><strong>{task.dependency||'Sem dependência'}</strong></div><div><span>Evidência obrigatória</span><strong>{task.evidence}</strong></div><div><span>Próxima ação</span><strong>{task.nextAction}</strong></div></div><div className="inline-info"><FileText size={18}/><span>Use o módulo Documentos para anexar a evidência e preservar a trilha de auditoria.</span></div></div><div className="drawer-foot"><button className="button secondary" onClick={close}>Cancelar</button><button className="button primary" onClick={()=>save(draft)}>Salvar atividade</button></div></section></div>
}

function Gates({tasks,doneDocuments}:{tasks:Task[];doneDocuments:string[]}) { return <div className="gate-list">{gates.map((g,i)=>{const related=tasks.filter(t=>t.gate.includes(g[0]));const progress=related.length?Math.round(related.reduce((a,t)=>a+t.progress,0)/related.length):0;const evidenceReady=doneDocuments.some(d=>g[4].toLowerCase().includes(d.toLowerCase())||d.toLowerCase().includes(g[4].split(' + ')[0].toLowerCase()));return <article className="gate-card" key={g[0]}><div className="gate-index"><span>{g[0]}</span>{i<gates.length-1&&<i/>}</div><div className="gate-content"><div className="gate-title"><div><h3>{g[1]}</h3><p>{g[3]}</p></div><StatusBadge status={progress===100&&evidenceReady?'Aprovado':progress>0?'Em desenvolvimento':'Não iniciado'}/></div><div className="gate-facts"><span>Dono<strong>{g[2]}</strong></span><span>Data planejada<strong className="mono">{g[5]}</strong></span><span>Evidência<strong>{g[4]}</strong></span><span>Atividades<strong>{related.length} vinculadas</strong></span></div><div className="gate-progress"><Progress value={progress}/><span>{progress}%</span></div><div className={`evidence-state ${evidenceReady?'ready':''}`}>{evidenceReady?<Check size={16}/>:<FileText size={16}/>} {evidenceReady?'Evidência disponível':'Evidência pendente'}</div></div></article>})}</div> }

function Schedule({tasks}:{tasks:Task[]}) {
  const weekDates=['07/09','14/09','21/09','28/09','05/10','12/10','19/10','26/10','02/11','09/11','16/11','23/11','30/11','07/12']
  const toDate=(s:string)=>{const [d,m,y]=s.split('/').map(Number);return new Date(y,m-1,d)}; const start=new Date(2026,8,7)
  return <div className="card gantt-card"><div className="gantt-legend"><span><i className="planned-dot"/> Planejado</span><span><i className="done-dot"/> Concluído</span><span>Período: 07/09–07/12/2026</span></div><div className="gantt-scroll"><div className="gantt" style={{gridTemplateColumns:`290px repeat(${weekDates.length}, 74px)`}}><div className="gantt-head sticky">Atividade</div>{weekDates.map(w=><div className="gantt-head" key={w}>{w}</div>)}{tasks.map(t=>{const offset=Math.max(0,Math.floor((toDate(t.start).getTime()-start.getTime())/604800000));const span=Math.max(1,Math.ceil((toDate(t.due).getTime()-toDate(t.start).getTime())/604800000)+1);return <div className="gantt-row" key={t.id}><div className="gantt-task sticky"><span className="mono">{t.id}</span><strong>{t.title}</strong><small>{t.gate} · {t.owner}</small></div><div className="gantt-cells" style={{gridTemplateColumns:`repeat(${weekDates.length},74px)`}}>{weekDates.map(w=><i key={w}/>)}</div><div className={`gantt-bar ${t.status==='Concluído'?'complete':''}`} style={{gridColumn:`${offset+2} / span ${span}`}}><span style={{width:`${t.progress}%`}}/></div></div>})}</div></div></div>
}

function Risks() { return <div className="card table-card"><div className="summary-strip"><span><strong>5</strong> itens abertos</span><span><strong>3</strong> críticos</span><span><strong>1</strong> Change Request</span><span><strong>0</strong> decisões vencidas</span></div><div className="table-scroll"><table><thead><tr><th>ID / tipo</th><th>Descrição</th><th>Gate</th><th>Severidade</th><th>Responsável</th><th>Impacto</th><th>Ação / decisão</th></tr></thead><tbody>{risks.map(r=><tr key={r[0]}><td><strong className="mono">{r[0]}</strong><small>{r[1]}</small></td><td><strong>{r[3]}</strong></td><td><span className="gate-pill">{r[2]}</span></td><td><StatusBadge status={r[4]}/></td><td>{r[5]}</td><td>{r[6]}</td><td>{r[7]}</td></tr>)}</tbody></table></div></div> }

function Documents({done,setDone}:{done:string[];setDone:(v:string[])=>void}) { const toggle=(name:string)=>setDone(done.includes(name)?done.filter(d=>d!==name):[...done,name]); return <><div className="document-summary"><div><span className="eyebrow dark">COBERTURA</span><strong>{Math.round(done.length/documents.length*100)}%</strong><Progress value={done.length/documents.length*100}/><small>{done.length} de {documents.length} evidências disponíveis</small></div><div className="inline-info"><ShieldCheck size={20}/><span><strong>Regra de governança</strong> Sem evidência obrigatória, o Gate permanece bloqueado para aprovação.</span></div></div><div className="document-grid">{documents.map(d=>{const ready=done.includes(d[0]);return <article className="document-card" key={d[0]}><div className={`file-icon ${ready?'ready':''}`}>{ready?<Check size={20}/>:<FileText size={20}/>}</div><div><h3>{d[0]}</h3><p><span className="gate-pill">{d[1]}</span> Responsável: {d[2]}</p><StatusBadge status={ready?'Aprovado':'Aguardando informação'}/></div><button className={`button ${ready?'secondary':'primary'}`} onClick={()=>toggle(d[0])}>{ready?'Remover evidência':'Simular envio'}</button></article>})}</div></> }

function Hours({actual,setActual}:{actual:number[];setActual:(v:number[])=>void}) { const planned=weeks.reduce((a,w)=>a+w[2],0), used=actual.reduce((a,b)=>a+b,0); return <><section className="kpi-grid three"><Kpi icon={Clock3} label="Horas planejadas" value={`${planned}h`} note="Limite da proposta" tone="info"/><Kpi icon={ClipboardCheck} label="Horas realizadas" value={`${used}h`} note={`${Math.round(used/planned*100)}% consumido`} tone="success"/><Kpi icon={CircleGauge} label="Saldo disponível" value={`${planned-used}h`} note={planned-used>=0?'Dentro do planejado':'Acima do planejado'} tone={planned-used>=0?'governance':'danger'}/></section><div className="card hours-card"><div className="hours-chart" aria-label="Gráfico de horas planejadas e realizadas">{weeks.map((w,i)=><div className="week-bar" key={w[0]}><div className="bars"><i style={{height:`${w[2]*22}px`}}/><b style={{height:`${actual[i]*22}px`}}/></div><span>{w[0]}</span></div>)}</div><div className="hours-inputs">{weeks.map((w,i)=><label key={w[0]}><span>{w[0]} <small>{w[1]}</small></span><input type="number" min="0" max="12" step="0.5" value={actual[i]} onChange={e=>setActual(actual.map((v,j)=>j===i?Number(e.target.value):v))}/><small>de {w[2]}h plan.</small></label>)}</div></div></> }

function Governance() { const raci=[['Brief / targets','A/R','C','C','C','A/C'],['Desenvolver fórmula','C','A/R','C','C','I'],['Verificação regulatória','I','C','A/R','I','I'],['Condições de fabricação','C','C','C','A/R','R'],['Aprovar produto','C','C','C','C','A/R'],['Teste industrial','A','R','C','R','R'],['Lançamento','I','I','I','I','A/R']]; return <div className="governance-grid"><div className="card table-card"><div className="card-head"><div><span className="eyebrow dark">RESPONSABILIDADES</span><h3>Matriz RACI resumida</h3></div></div><div className="table-scroll"><table className="raci"><thead><tr><th>Atividade</th><th>PL / PMO</th><th>P&D</th><th>Reg.</th><th>Qualidade</th><th>Aky</th></tr></thead><tbody>{raci.map(r=><tr key={r[0]}>{r.map((c,i)=><td key={c} className={i?'mono':''}>{c}</td>)}</tr>)}</tbody></table></div><div className="raci-legend"><span><b>R</b> Executa</span><span><b>A</b> Responde pela decisão</span><span><b>C</b> Consultado</span><span><b>I</b> Informado</span></div></div><div className="rituals"><Ritual title="Weekly Project Sync" cadence="Semanal · 30–45 min" output="Board atualizado + ações" rule="Toda ação deve ter dono e prazo"/><Ritual title="Technical Sync" cadence="Sob demanda · 30–60 min" output="Decisões técnicas registradas" rule="BLOCKER retorna à etapa competente"/><Ritual title="Gate Review" cadence="Por marco · 30–45 min" output="Go / Hold / Return" rule="Sem evidência, sem avanço"/><Ritual title="Client Steering" cadence="Quinzenal · 30 min" output="Decisões e prioridades" rule="Escalar desvios críticos"/></div></div> }
function Ritual({title,cadence,output,rule}:{title:string;cadence:string;output:string;rule:string}) { return <article className="card ritual"><div><span className="ritual-icon"><Users size={18}/></span><div><h3>{title}</h3><p>{cadence}</p></div></div><dl><div><dt>Saída</dt><dd>{output}</dd></div><div><dt>Regra</dt><dd>{rule}</dd></div></dl></article> }

export default App
