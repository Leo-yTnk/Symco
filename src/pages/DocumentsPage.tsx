import { Check, FileCheck2, FileText, ShieldCheck } from 'lucide-react'
import { documents } from '../data'
import type { BoardGate } from '../types'
import { Progress, StatusBadge } from '../components/ui'

export function DocumentsPage({ gates, done, setDone }: { gates: BoardGate[]; done: string[]; setDone: (documents: string[]) => void }) {
  const dynamicDocuments: [string, string, string][] = documents.map(item => [...item])
  gates.forEach(gate => {
    if (gate.evidence !== 'A definir' && !dynamicDocuments.some(item => item[0] === gate.evidence)) dynamicDocuments.push([gate.evidence, gate.id, gate.decisionOwner])
  })
  const toggle = (name: string) => setDone(done.includes(name) ? done.filter(document => document !== name) : [...done, name])
  const approvedCount = dynamicDocuments.filter(item => done.includes(item[0])).length
  const coverage = Math.round(approvedCount / dynamicDocuments.length * 100)
  return <div className="page-stack documents-page"><section className="document-overview"><div><strong>{coverage}%</strong><Progress value={coverage} tone="violet" /><small>{approvedCount} de {dynamicDocuments.length} evidências aprovadas</small></div><div><ShieldCheck size={24} /><span><strong>Regra de liberação</strong>Um Gate só avança quando sua evidência obrigatória estiver disponível e aprovada.</span></div></section><div className="document-groups">{gates.map(gate => { const items = dynamicDocuments.filter(document => document[1] === gate.id); if (!items.length) return null; return <section key={gate.id}><header><span>{gate.id}</span><div><h2>{gate.name}</h2><small>{gate.description}</small></div><strong>{items.filter(item => done.includes(item[0])).length}/{items.length}</strong></header><div>{items.map(document => { const ready = done.includes(document[0]); return <article className={ready ? 'document-ready' : ''} key={document[0]}><span className="file-icon">{ready ? <FileCheck2 size={20} /> : <FileText size={20} />}</span><div><h3>{document[0]}</h3><small>Responsável · {document[2]}</small></div><StatusBadge status={ready ? 'Aprovado' : 'Aguardando informação'} /><button className={`button ${ready ? 'subtle' : 'primary'}`} onClick={() => toggle(document[0])}>{ready ? <><Check size={15} />Aprovado</> : 'Simular envio'}</button></article> })}</div></section> })}</div></div>
}
