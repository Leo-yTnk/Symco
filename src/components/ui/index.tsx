import type { LucideIcon } from 'lucide-react'

export function StatusBadge({ status }: { status: string }) {
  const slug = status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
  return <span className={`status status-${slug}`}><i />{status}</span>
}

export function Progress({ value, tone = 'default' }: { value: number; tone?: string }) {
  const safeValue = Math.min(100, Math.max(0, value))
  return <div className={`progress progress-${tone}`} aria-label={`${Math.round(safeValue)}% concluído`}><span style={{ width: `${safeValue}%` }} /></div>
}

export function Metric({ icon: Icon, label, value, note, tone = 'info' }: { icon: LucideIcon; label: string; value: string; note: string; tone?: string }) {
  return <article className={`metric metric-${tone}`}>
    <span className="metric-icon"><Icon size={19} /></span>
    <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
  </article>
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="section-title"><div><h2>{title}</h2></div>{action}</div>
}
