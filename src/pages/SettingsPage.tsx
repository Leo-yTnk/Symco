import { Check, Gauge, MonitorCog, MoveHorizontal, Palette, Sparkles } from 'lucide-react'
import type { UserPreferences } from '../types'

type Props = {
  preferences: UserPreferences
  updatePreferences: (next: Partial<UserPreferences>) => void
}

const accents = [
  ['cyan', 'Oceano', '#13b8cc'],
  ['violet', 'Íris', '#7668ca'],
  ['emerald', 'Floresta', '#2b9a70'],
] as const

export function SettingsPage({ preferences, updatePreferences }: Props) {
  return <div className="page-stack settings-page">
    <section className="settings-category card">
      <header><span className="settings-icon"><Palette size={19} /></span><div><h2>Aparência</h2><p>Defina o tom visual da sua área de trabalho.</p></div></header>
      <div className="setting-row setting-row-stack">
        <div><strong>Cor de destaque</strong><small>Aplicada a seleções, indicadores e ações principais.</small></div>
        <div className="accent-options" role="radiogroup" aria-label="Cor de destaque">
          {accents.map(([value, label, color]) => <button key={value} role="radio" aria-checked={preferences.accent === value} className={preferences.accent === value ? 'selected' : ''} onClick={() => updatePreferences({ accent: value })}><i style={{ background: color }} />{label}{preferences.accent === value && <Check size={14} />}</button>)}
        </div>
      </div>
    </section>

    <section className="settings-category card">
      <header><span className="settings-icon"><MoveHorizontal size={19} /></span><div><h2>Navegação</h2><p>Ajuste o espaço ocupado pela barra lateral.</p></div></header>
      <label className="setting-row width-setting">
        <div><strong>Largura da sidebar</strong><small>Abaixo de 180 px, a navegação assume o modo compacto.</small></div>
        <div className="range-control"><input type="range" min="74" max="340" step="4" value={preferences.sidebarWidth} onChange={event => updatePreferences({ sidebarWidth: Number(event.target.value) })} /><output>{preferences.sidebarWidth}px</output></div>
      </label>
    </section>

    <section className="settings-category card">
      <header><span className="settings-icon"><MonitorCog size={19} /></span><div><h2>Experiência</h2><p>Escolha o ritmo e a quantidade de informação na tela.</p></div></header>
      <div className="setting-row"><div><strong>Densidade de conteúdo</strong><small>Compacta reduz espaços para mostrar mais itens.</small></div><div className="segmented-control"><button className={preferences.density === 'comfortable' ? 'selected' : ''} onClick={() => updatePreferences({ density: 'comfortable' })}><Sparkles size={14} />Confortável</button><button className={preferences.density === 'compact' ? 'selected' : ''} onClick={() => updatePreferences({ density: 'compact' })}><Gauge size={14} />Compacta</button></div></div>
      <div className="setting-row"><div><strong>Movimento da interface</strong><small>Reduza as transições em cadeia, se preferir.</small></div><div className="segmented-control"><button className={preferences.motion === 'full' ? 'selected' : ''} onClick={() => updatePreferences({ motion: 'full' })}>Completo</button><button className={preferences.motion === 'reduced' ? 'selected' : ''} onClick={() => updatePreferences({ motion: 'reduced' })}>Reduzido</button></div></div>
    </section>
  </div>
}
