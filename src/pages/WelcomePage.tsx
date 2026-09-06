import { ArrowRight, LayoutDashboard, SlidersHorizontal, Sparkles } from 'lucide-react'

export function WelcomePage({ continueToApp }: { continueToApp: () => void }) {
  return <main className="welcome-page">
    <section className="welcome-panel">
      <div className="welcome-brand"><span className="brand-mark">sy</span><strong>SymOS</strong></div>
      <div className="welcome-copy">
        <span className="eyebrow inverse">SEU AMBIENTE DE PROJETOS</span>
        <h1>Bem-vindo ao SymOS.</h1>
        <p>Planejamento, decisões e execução em um só lugar — com o contexto certo para cada etapa.</p>
      </div>
      <div className="welcome-features">
        <div><LayoutDashboard size={20} /><span><strong>Visão integrada</strong><small>Acompanhe avanço, riscos e próximos marcos.</small></span></div>
        <div><SlidersHorizontal size={20} /><span><strong>Do seu jeito</strong><small>Ajuste aparência, densidade e navegação.</small></span></div>
        <div><Sparkles size={20} /><span><strong>Foco no essencial</strong><small>Uma experiência fluida para decidir e agir.</small></span></div>
      </div>
      <button className="welcome-action" onClick={continueToApp}>Entrar no workspace <ArrowRight size={18} /></button>
      <small className="welcome-note">Esta apresentação aparece somente no primeiro acesso.</small>
    </section>
  </main>
}
