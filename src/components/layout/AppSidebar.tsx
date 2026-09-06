import { ChevronRight, MoreHorizontal, X } from 'lucide-react'
import { navigation } from '../../config/navigation'
import type { Navigate, View } from '../../types'

export function AppSidebar({ view, open, navigate, close }: { view: View; open: boolean; navigate: Navigate; close: () => void }) {
  return <>
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand"><span className="brand-mark">sy</span><span><strong>symco.</strong><small>FOOD TECH</small></span></div>
      <button className="mobile-close" onClick={close} aria-label="Fechar menu"><X size={20} /></button>
      <div className="project-switcher"><span>PROJETO ATIVO</span><strong>Aky Alimentos</strong><small>Plataforma de Maionese</small><i>PRJ-127</i></div>
      <nav aria-label="Navegação principal">
        {navigation.map(([id, label, Icon]) => <button key={id} className={view === id ? 'active' : ''} onClick={() => navigate(id)}>
          <Icon size={18} /><span>{label}</span>{view === id && <ChevronRight size={14} />}
        </button>)}
      </nav>
      <div className="sidebar-foot"><div className="avatar">PT</div><span><strong>Patrick Tanaka</strong><small>Project Lead · Symco</small></span><MoreHorizontal size={18} /></div>
    </aside>
    {open && <button className="nav-scrim" onClick={close} aria-label="Fechar navegação" />}
  </>
}
