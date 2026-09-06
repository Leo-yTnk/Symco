import { ChevronRight, Settings, X } from 'lucide-react'
import { navigation } from '../../config/navigation'
import type { Navigate, View } from '../../types'

const navigationGroups = [
  { label: 'Visão do projeto', items: navigation.slice(0, 1) },
  { label: 'Planejamento e execução', items: navigation.slice(1, 4) },
  { label: 'Controles do projeto', items: navigation.slice(4) },
]

export function AppSidebar({ view, open, navigate, close, width, setWidth }: { view: View; open: boolean; navigate: Navigate; close: () => void; width: number; setWidth: (width: number) => void }) {
  const compact = width < 180
  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const originX = event.clientX
    const originWidth = width
    event.currentTarget.setPointerCapture(event.pointerId)
    const move = (moveEvent: PointerEvent) => setWidth(Math.min(340, Math.max(74, originWidth + moveEvent.clientX - originX)))
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  return <>
    <aside className={`sidebar ${open ? 'is-open' : ''} ${compact ? 'is-compact' : ''}`} style={{ '--sidebar-width': `${width}px` } as React.CSSProperties}>
      <div className="brand sidebar-island"><span className="brand-mark">sy</span><span><strong>SymOS</strong><small>BY SYMCO</small></span></div>
      <button className="mobile-close" onClick={close} aria-label="Fechar menu"><X size={20} /></button>
      <div className="project-switcher sidebar-island"><span>PROJETO ATIVO</span><strong>Aky Alimentos</strong><small>Plataforma de Maionese</small><i>PRJ-127</i></div>
      <nav aria-label="Navegação principal">
        {navigationGroups.map((group, groupIndex) => <div className="nav-island sidebar-island" role="group" aria-label={group.label} key={group.label} style={{ '--group-index': groupIndex } as React.CSSProperties}>
          {group.items.map(([id, label, Icon]) => {
            const index = navigation.findIndex(([navigationId]) => navigationId === id)
            return <button key={id} className={view === id ? 'active' : ''} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined} style={{ '--nav-index': index } as React.CSSProperties}>
              <Icon size={18} /><span>{label}</span>{view === id && <ChevronRight size={14} />}
            </button>
          })}
        </div>)}
      </nav>
      <div className="sidebar-foot sidebar-island"><div className="avatar">PT</div><span><strong>Patrick Tanaka</strong><small>Project Lead · Symco</small></span><button className={`sidebar-settings ${view === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')} aria-label="Abrir configurações" title="Configurações"><Settings size={17} /></button></div>
      <button className="sidebar-resizer" onPointerDown={startResize} onKeyDown={event => {
        if (event.key === 'ArrowLeft') setWidth(Math.max(74, width - 4))
        if (event.key === 'ArrowRight') setWidth(Math.min(340, width + 4))
      }} aria-label="Ajustar largura da barra lateral" title="Arraste para ajustar a largura" />
    </aside>
    {open && <button className="nav-scrim" onClick={close} aria-label="Fechar navegação" />}
  </>
}
