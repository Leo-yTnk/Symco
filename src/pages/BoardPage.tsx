import {
  CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, FileText,
  Filter, Flag, LayoutList, Plus, Search, SlidersHorizontal, Sparkles, Target, X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { statuses } from '../config/navigation'
import { taskClassifications, type BoardGate, type Sprint, type Task, type TaskClassification, type TaskStatus } from '../types'
import { Progress, StatusBadge } from '../components/ui'
import { taskFitsSprint, toDisplayDate, toIsoDate } from '../services/boardStorage'

type BoardProps = {
  tasks: Task[]; sprints: Sprint[]; gates: BoardGate[]
  select: (task: Task) => void
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>
  setGates: React.Dispatch<React.SetStateAction<BoardGate[]>>
  notify: (message: string) => void
}
type Modal = 'task' | 'sprint' | 'gate' | null
const ownerOptions = (tasks: Task[]) => [...new Set(tasks.map(task => task.owner))].sort()

export function BoardPage({ tasks, sprints, gates, select, setTasks, setSprints, setGates, notify }: BoardProps) {
  const [activeSprint, setActiveSprint] = useState(() => localStorage.getItem('symos-active-sprint') || sprints[0]?.id || '')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TaskStatus | 'Todos'>('Todos')
  const [owner, setOwner] = useState('Todos')
  const [priority, setPriority] = useState<Task['priority'] | 'Todas'>('Todas')
  const [gateFilter, setGateFilter] = useState('Todos')
  const [classification, setClassification] = useState<TaskClassification | 'Todas'>('Todas')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [taskGate, setTaskGate] = useState<string>()

  useEffect(() => { localStorage.setItem('symos-active-sprint', activeSprint) }, [activeSprint])
  useEffect(() => { if (!sprints.some(item => item.id === activeSprint) && sprints[0]) setActiveSprint(sprints[0].id) }, [sprints, activeSprint])

  const sprint = sprints.find(item => item.id === activeSprint)
  const sprintTasks = tasks.filter(task => task.sprintId === activeSprint)
  const filtered = useMemo(() => sprintTasks.filter(task =>
    (status === 'Todos' || task.status === status) && (owner === 'Todos' || task.owner === owner) &&
    (priority === 'Todas' || task.priority === priority) && (gateFilter === 'Todos' || task.gate.includes(gateFilter)) &&
    (classification === 'Todas' || task.classification === classification) &&
    `${task.id} ${task.title} ${task.owner} ${task.gate} ${task.module}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [sprintTasks, status, owner, priority, gateFilter, classification, query])
  const activeFilterCount = [status !== 'Todos', owner !== 'Todos', priority !== 'Todas', gateFilter !== 'Todos', classification !== 'Todas'].filter(Boolean).length
  const completed = sprintTasks.filter(task => task.status === 'Concluído').length
  const progress = sprintTasks.length ? Math.round(sprintTasks.reduce((sum, task) => sum + task.progress, 0) / sprintTasks.length) : 0
  const clearFilters = () => { setStatus('Todos'); setOwner('Todos'); setPriority('Todas'); setGateFilter('Todos'); setClassification('Todas'); setQuery('') }
  const openTask = (gate?: string) => { setTaskGate(gate); setModal('task') }

  return <div className="page-stack board-page">
    <section className="sprint-workspace card">
      <div className="sprint-tabs" role="tablist" aria-label="Sprints do projeto">
        {sprints.map(item => <button key={item.id} className={item.id === activeSprint ? 'active' : ''} onClick={() => setActiveSprint(item.id)} role="tab" aria-selected={item.id === activeSprint}><span>{item.name}{item.status === 'Ativa' && <i>ATIVA</i>}</span><small>{item.start.slice(0, 5)} — {item.end.slice(0, 5)}</small></button>)}
        <button className="new-sprint-tab" onClick={() => setModal('sprint')}><Plus size={15} /> Criar sprint</button>
      </div>
      {sprint && <div className="sprint-summary"><div className="sprint-goal"><Target size={18} /><span><small>OBJETIVO DA SPRINT</small><strong>{sprint.goal}</strong></span></div><div className="sprint-stat"><span>{sprintTasks.length}</span><small>tarefas</small></div><div className="sprint-stat"><span>{completed}</span><small>concluídas</small></div><div className="sprint-progress"><span><small>PROGRESSO</small><b>{progress}%</b></span><Progress value={progress} /></div></div>}
    </section>

    <section className="board-toolbar card">
      <label className="board-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar tarefa, ID, módulo ou pessoa" />{query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={14} /></button>}</label>
      <button className={`filter-trigger ${filtersOpen || activeFilterCount ? 'active' : ''}`} onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontal size={16} /> Filtros {activeFilterCount > 0 && <b>{activeFilterCount}</b>}<ChevronDown size={14} /></button>
      <div className="board-actions"><button className="button subtle" onClick={() => setModal('gate')}><Plus size={15} /> Criar gate</button><button className="button primary" data-create-task onClick={() => openTask()}><Plus size={16} /> Criar tarefa</button></div>
      {filtersOpen && <div className="filter-panel"><label>Status<select value={status} onChange={event => setStatus(event.target.value as typeof status)}><option>Todos</option>{statuses.map(item => <option key={item}>{item}</option>)}</select></label><label>Responsável<select value={owner} onChange={event => setOwner(event.target.value)}><option>Todos</option>{ownerOptions(tasks).map(item => <option key={item}>{item}</option>)}</select></label><label>Classificação<select value={classification} onChange={event => setClassification(event.target.value as typeof classification)}><option>Todas</option>{taskClassifications.map(item => <option key={item}>{item}</option>)}</select></label><label>Prioridade<select value={priority} onChange={event => setPriority(event.target.value as typeof priority)}><option>Todas</option><option>Crítica</option><option>Alta</option><option>Média</option></select></label><label>Gate<select value={gateFilter} onChange={event => setGateFilter(event.target.value)}><option>Todos</option>{gates.map(item => <option key={item.id}>{item.id}</option>)}</select></label><button className="text-button" onClick={clearFilters}><X size={14} /> Limpar filtros</button></div>}
    </section>

    <div className="board-result-line"><span><LayoutList size={15} /><b>{filtered.length}</b> de {sprintTasks.length} tarefas nesta sprint</span>{activeFilterCount > 0 && <button onClick={clearFilters}>Limpar filtros</button>}</div>
    <div className="gate-groups">{gates.map(gate => {
      const items = filtered.filter(task => task.gate.includes(gate.id)); if (!items.length && (activeFilterCount > 0 || query)) return null
      const gateProgress = items.length ? Math.round(items.reduce((sum, task) => sum + task.progress, 0) / items.length) : 0
      return <section className="task-group" key={gate.id} style={{ '--gate-color': gate.color } as React.CSSProperties}><div className="task-group-title"><span>{gate.id}</span><div><h2>{gate.name}</h2><small>{gate.description}</small></div><div className="gate-completion"><Progress value={gateProgress} /><strong>{gateProgress}%</strong></div><b>{items.length}</b></div><div className={`task-list ${items.length ? '' : 'gate-empty-list'}`}><div className="task-columns"><span>TAREFA</span><span>RESPONSÁVEL</span><span>STATUS</span><span>PROGRESSO</span><span>PRAZO</span><i /></div>{items.map(task => <button className="task-row" key={task.id} onClick={() => select(task)}><span className={`priority-mark priority-${task.priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} /><div className="task-identity"><small>{task.id}<span className="classification-pill">{task.classification}</span></small><strong>{task.title}</strong><span><Flag size={11} /> {task.priority}</span></div><div className="task-owner"><span>{task.owner.split(' ').slice(0, 2).map(word => word[0]).join('')}</span><strong>{task.owner}</strong></div><StatusBadge status={task.status} /><div className="task-progress"><span>{task.progress}%</span><Progress value={task.progress} /></div><time>{task.due.slice(0, 5)}</time><ChevronRight size={17} /></button>)}{!items.length && <div className="gate-empty-message"><CheckCircle2 size={18} /><span><strong>Gate criado e sincronizado</strong><small>Adicione a primeira tarefa para iniciar o acompanhamento.</small></span></div>}<button className="add-inline-task" onClick={() => openTask(gate.id)}><Plus size={14} /> Adicionar tarefa neste gate</button></div></section>
    })}</div>
    {!filtered.length && <section className="board-empty card"><Filter size={25} /><h2>Nenhuma tarefa encontrada</h2><p>Ajuste os filtros ou adicione uma tarefa dentro do período desta sprint.</p><div><button className="button subtle" onClick={clearFilters}>Limpar filtros</button><button className="button primary" onClick={() => setModal('task')}><Plus size={15} /> Criar tarefa</button></div></section>}

    {modal === 'task' && sprint && <CreateTaskModal sprint={sprint} gates={gates} tasks={tasks} initialGate={taskGate} close={() => setModal(null)} create={task => { setTasks(current => [...current, task]); setModal(null); notify(`${task.id} criada em ${sprint.name} e sincronizada com o projeto.`) }} />}
    {modal === 'sprint' && <CreateSprintModal sprints={sprints} close={() => setModal(null)} create={item => { setSprints(current => [...current, item]); setActiveSprint(item.id); setModal(null); notify(`${item.name} criada e pronta para planejamento.`) }} />}
    {modal === 'gate' && <CreateGateModal gates={gates} close={() => setModal(null)} create={item => { setGates(current => [...current, item]); setModal(null); notify(`${item.id} · ${item.name} adicionado ao board.`) }} />}
  </div>
}

function ModalShell({ title, eyebrow, icon, close, children }: { title: string; eyebrow: string; icon: React.ReactNode; close: () => void; children: React.ReactNode }) {
  return <div className="overlay modal-overlay" onMouseDown={event => event.target === event.currentTarget && close()}><section className="create-modal" role="dialog" aria-modal="true"><header><span className="modal-icon">{icon}</span><div><small>{eyebrow}</small><h2>{title}</h2></div><button className="icon-button" onClick={close} aria-label="Fechar"><X size={20} /></button></header>{children}</section></div>
}

function CreateTaskModal({ sprint, gates, tasks, initialGate, close, create }: { sprint: Sprint; gates: BoardGate[]; tasks: Task[]; initialGate?: string; close: () => void; create: (task: Task) => void }) {
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', classification: 'SymProduct™' as TaskClassification, owner: '', gate: initialGate || gates[0]?.id || '', priority: 'Alta' as Task['priority'], start: toIsoDate(sprint.start), due: toIsoDate(sprint.end) })
  const submit = (event: FormEvent) => { event.preventDefault(); const candidate = { start: toDisplayDate(form.start), due: toDisplayDate(form.due) }; if (!taskFitsSprint(candidate, sprint)) return setError(`A tarefa deve começar e terminar entre ${sprint.start} e ${sprint.end}.`); if (form.due < form.start) return setError('A data final não pode ser anterior à data inicial.'); if (!form.title.trim() || !form.owner.trim()) return setError('Preencha o título e o responsável.'); const nextNumber = Math.max(0, ...tasks.map(task => Number(task.id.replace(/\D/g, '')) || 0)) + 1; create({ id: `T${String(nextNumber).padStart(3, '0')}`, title: form.title.trim(), module: form.classification, classification: form.classification, owner: form.owner.trim(), support: 'A definir', gate: form.gate, priority: form.priority, start: candidate.start, due: candidate.due, status: 'Não iniciado', progress: 0, plannedHours: 0, actualHours: 0, evidence: 'A definir', nextAction: 'Planejar próxima ação', sprintId: sprint.id }) }
  return <ModalShell title="Criar tarefa" eyebrow={sprint.name} icon={<CheckCircle2 size={20} />} close={close}><form onSubmit={submit} className="create-form"><div className="sprint-boundary"><CalendarDays size={17} /><span><small>JANELA PERMITIDA</small><strong>{sprint.start} — {sprint.end}</strong></span></div><label className="span-2">Título da tarefa<input autoFocus value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Ex.: Validar requisitos do protótipo" /></label><label>Classificação<select value={form.classification} onChange={event => setForm({ ...form, classification: event.target.value as TaskClassification })}>{taskClassifications.map(item => <option key={item}>{item}</option>)}</select></label><label>Responsável<input value={form.owner} onChange={event => setForm({ ...form, owner: event.target.value })} placeholder="Nome da pessoa" /></label><label>Gate<select value={form.gate} onChange={event => setForm({ ...form, gate: event.target.value })}>{gates.map(gate => <option key={gate.id} value={gate.id}>{gate.id} · {gate.name}</option>)}</select></label><label>Prioridade<select value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value as Task['priority'] })}><option>Crítica</option><option>Alta</option><option>Média</option></select></label><label>Início<input type="date" min={toIsoDate(sprint.start)} max={toIsoDate(sprint.end)} value={form.start} onChange={event => setForm({ ...form, start: event.target.value })} /></label><label>Conclusão<input type="date" min={form.start} max={toIsoDate(sprint.end)} value={form.due} onChange={event => setForm({ ...form, due: event.target.value })} /></label>{error && <div className="form-error span-2"><CircleAlert size={16} />{error}</div>}<footer className="span-2"><button type="button" className="button subtle" onClick={close}>Cancelar</button><button className="button primary"><Plus size={16} /> Criar tarefa</button></footer></form></ModalShell>
}

function CreateSprintModal({ sprints, close, create }: { sprints: Sprint[]; close: () => void; create: (sprint: Sprint) => void }) {
  const [error, setError] = useState(''); const [form, setForm] = useState({ name: `Sprint ${String(sprints.length + 1).padStart(2, '0')}`, goal: '', start: '', end: '' })
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name.trim() || !form.goal.trim() || !form.start || !form.end) return setError('Preencha todos os campos para planejar a sprint.'); if (form.end < form.start) return setError('O término da sprint deve ser posterior ao início.'); create({ id: `sprint-${Date.now()}`, name: form.name.trim(), goal: form.goal.trim(), start: toDisplayDate(form.start), end: toDisplayDate(form.end), status: 'Planejada' }) }
  return <ModalShell title="Criar sprint" eyebrow="Planejamento ágil" icon={<Sparkles size={20} />} close={close}><form onSubmit={submit} className="create-form"><label>Nome<input autoFocus value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>Período inicial<input type="date" value={form.start} onChange={event => setForm({ ...form, start: event.target.value })} /></label><label className="span-2">Objetivo da sprint<textarea value={form.goal} onChange={event => setForm({ ...form, goal: event.target.value })} placeholder="Que resultado concreto esta sprint deve entregar?" /></label><label>Período final<input type="date" min={form.start} value={form.end} onChange={event => setForm({ ...form, end: event.target.value })} /></label>{error && <div className="form-error"><CircleAlert size={16} />{error}</div>}<footer className="span-2"><button type="button" className="button subtle" onClick={close}>Cancelar</button><button className="button primary"><Plus size={16} /> Criar sprint</button></footer></form></ModalShell>
}

function CreateGateModal({ gates, close, create }: { gates: BoardGate[]; close: () => void; create: (gate: BoardGate) => void }) {
  const [form, setForm] = useState({ name: '', description: '', decisionOwner: '', evidence: '', plannedDate: '', color: '#2475d0' }); const [error, setError] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.name.trim() || !form.description.trim() || !form.decisionOwner.trim() || !form.evidence.trim() || !form.plannedDate) return setError('Complete os dados de decisão para sincronizar o gate.'); const numbers = gates.map(gate => Number(gate.id.match(/^G(\d+)/)?.[1] || 0)); const id = `G${Math.max(-1, ...numbers) + 1}`; create({ id, name: form.name.trim(), description: form.description.trim(), decisionOwner: form.decisionOwner.trim(), evidence: form.evidence.trim(), plannedDate: toDisplayDate(form.plannedDate), color: form.color }) }
  return <ModalShell title="Criar gate" eyebrow="Sincronizado com Stage-Gates" icon={<Target size={20} />} close={close}><form onSubmit={submit} className="create-form"><div className="sync-notice span-2"><Sparkles size={16} /><span><strong>Fonte única de verdade</strong><small>Este gate aparecerá no Project Board e em Stage-Gates.</small></span></div><label className="span-2">Nome do gate<input autoFocus value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Validação sensorial" /></label><label className="span-2">Pergunta de decisão<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Qual condição precisa ser atendida para avançar?" /></label><label>Quem decide<input value={form.decisionOwner} onChange={event => setForm({ ...form, decisionOwner: event.target.value })} placeholder="Pessoa ou papel" /></label><label>Evidência de saída<input value={form.evidence} onChange={event => setForm({ ...form, evidence: event.target.value })} placeholder="Documento ou aprovação" /></label><label>Data planejada<input type="date" value={form.plannedDate} onChange={event => setForm({ ...form, plannedDate: event.target.value })} /></label><label>Cor de identificação<input className="color-input" type="color" value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} /></label>{error && <div className="form-error span-2"><CircleAlert size={16} />{error}</div>}<footer className="span-2"><button type="button" className="button subtle" onClick={close}>Cancelar</button><button className="button primary"><Plus size={16} /> Criar e sincronizar gate</button></footer></form></ModalShell>
}

export function TaskDrawer({ task, close, save }: { task: Task; close: () => void; save: (task: Task) => void }) {
  const [draft, setDraft] = useState(task)
  return <div className="overlay" onMouseDown={event => event.target === event.currentTarget && close()}><section className="drawer" role="dialog" aria-modal="true" aria-labelledby="task-title"><div className="drawer-head"><div><span className="eyebrow">{task.id} · {task.gate}</span><h2 id="task-title">{task.title}</h2></div><button className="icon-button" onClick={close} aria-label="Fechar"><X size={20} /></button></div><div className="drawer-body"><div className="field-grid"><label>Status<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as TaskStatus, progress: event.target.value === 'Concluído' ? 100 : draft.progress })}>{statuses.map(item => <option key={item}>{item}</option>)}</select></label><label>Prioridade<select value={draft.priority} onChange={event => setDraft({ ...draft, priority: event.target.value as Task['priority'] })}><option>Crítica</option><option>Alta</option><option>Média</option></select></label><label className="span-2">Classificação<select value={draft.classification || 'SymProduct™'} onChange={event => setDraft({ ...draft, classification: event.target.value as TaskClassification, module: event.target.value })}>{taskClassifications.map(item => <option key={item}>{item}</option>)}</select></label></div><label className="range-field"><span>Progresso <b>{draft.progress}%</b></span><input type="range" min="0" max="100" step="5" value={draft.progress} onChange={event => { const progress = Number(event.target.value); setDraft({ ...draft, progress, status: progress === 100 ? 'Concluído' : progress > 0 ? 'Em andamento' : draft.status }) }} /></label><div className="detail-list"><div><span>Responsável</span><strong>{task.owner}</strong></div><div><span>Apoio</span><strong>{task.support}</strong></div><div><span>Período</span><strong>{task.start} — {task.due}</strong></div><div><span>Dependência</span><strong>{task.dependency || 'Sem dependência'}</strong></div><div><span>Evidência</span><strong>{task.evidence}</strong></div><div><span>Próxima ação</span><strong>{task.nextAction}</strong></div></div><div className="inline-info"><FileText size={18} /><span>Alterações são sincronizadas com indicadores, cronograma e Stage-Gates.</span></div></div><div className="drawer-foot"><button className="button subtle" onClick={close}>Cancelar</button><button className="button primary" onClick={() => save(draft)}>Salvar e sincronizar</button></div></section></div>
}
