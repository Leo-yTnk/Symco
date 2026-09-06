import { Bell, HelpCircle, Menu, Search } from 'lucide-react'

export function Topbar({ openMenu }: { openMenu: () => void }) {
  return <header className="topbar">
    <div className="topbar-island topbar-context">
      <button className="menu-button" onClick={openMenu} aria-label="Abrir menu"><Menu size={20} /></button>
      <div className="project-context"><span className="context-dot" /><strong>Aky Alimentos</strong><small>Projeto em preparação</small></div>
    </div>
    <label className="global-search"><Search size={16} /><input aria-label="Busca global" placeholder="Buscar no projeto" /><kbd>⌘ K</kbd></label>
    <div className="topbar-island top-actions"><button aria-label="Ajuda"><HelpCircle size={18} /></button><button aria-label="Notificações" className="has-notification"><Bell size={18} /></button><span className="environment">PROTO</span></div>
  </header>
}
