import { Check, FileText, LockKeyhole, Target } from 'lucide-react'
import type { BoardGate, Task } from '../types'
import { Progress, StatusBadge } from '../components/ui'

export function GatesPage({ tasks, gates, doneDocuments }: { tasks: Task[]; gates: BoardGate[]; doneDocuments: string[] }) {
  return <div className="page-stack gate-roadmap">{gates.map((gate, index) => {
    const related = tasks.filter(task => task.gate.includes(gate.id))
    const progress = related.length ? Math.round(related.reduce((sum, task) => sum + task.progress, 0) / related.length) : 0
    const evidenceReady = doneDocuments.some(document => gate.evidence.toLowerCase().includes(document.toLowerCase()) || document.toLowerCase().includes(gate.evidence.split(' + ')[0].toLowerCase()))
    const state = progress === 100 && evidenceReady ? 'Aprovado' : progress > 0 ? 'Em desenvolvimento' : 'Não iniciado'
    return <article className={`gate-step ${index === 0 ? 'gate-current' : ''}`} key={gate.id}>
      <div className="gate-rail"><span style={{ borderColor: gate.color }}>{gate.id}</span>{index < gates.length - 1 && <i />}</div>
      <div className="gate-panel"><header><div><span className="gate-sequence">DECISÃO {String(index + 1).padStart(2, '0')}</span><h2>{gate.name}</h2></div><StatusBadge status={state} /></header><blockquote>“{gate.description}”</blockquote><div className="gate-criteria"><div><Target size={17} /><span>Quem decide<strong>{gate.decisionOwner}</strong></span></div><div><FileText size={17} /><span>Evidência de saída<strong>{gate.evidence}</strong></span></div><div><LockKeyhole size={17} /><span>Data planejada<strong>{gate.plannedDate}</strong></span></div></div><footer><div><Progress value={progress} /><span>{progress}% das atividades</span></div><span className={evidenceReady ? 'ready' : ''}>{evidenceReady ? <Check size={15} /> : <FileText size={15} />}{evidenceReady ? 'Evidência pronta' : 'Evidência pendente'}</span></footer></div>
    </article>
  })}</div>
}
