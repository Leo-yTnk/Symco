import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export type SelectOption = { value: string; label: string; disabled?: boolean }

export function Select({ value, options, onChange, placeholder = 'Selecione', ariaLabel }: { value: string; options: SelectOption[]; onChange: (value: string) => void; placeholder?: string; ariaLabel?: string }) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [active, setActive] = useState(() => Math.max(0, options.findIndex(option => option.value === value)))
  const root = useRef<HTMLDivElement>(null)
  const selected = options.find(option => option.value === value)
  const close = () => { if (!open || closing) return; setClosing(true); window.setTimeout(() => { setOpen(false); setClosing(false) }, 150) }
  useEffect(() => { const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close() }; document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside) }, [open, closing])
  useEffect(() => { if (open) setActive(Math.max(0, options.findIndex(option => option.value === value))) }, [open, options, value])
  const choose = (index: number) => { const option = options[index]; if (!option || option.disabled) return; onChange(option.value); close() }
  const keyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') return close()
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); return open ? choose(active) : setOpen(true) }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); const direction = event.key === 'ArrowDown' ? 1 : -1; setActive(current => (current + direction + options.length) % options.length) }
  }
  return <div className={`custom-select ${open ? 'is-open' : ''}`} ref={root}><button type="button" className="custom-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => open ? close() : setOpen(true)} onKeyDown={keyDown}><span className={selected ? '' : 'placeholder'}>{selected?.label || placeholder}</span><ChevronDown size={15} /></button>{open && <div className={`custom-select-menu ${closing ? 'popup-closing' : ''}`} role="listbox">{options.map((option, index) => <button type="button" role="option" aria-selected={option.value === value} disabled={option.disabled} className={index === active ? 'is-active' : ''} key={option.value} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}><span>{option.label}</span>{option.value === value && <Check size={14} />}</button>)}</div>}</div>
}

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
