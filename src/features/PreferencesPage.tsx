import { useId, useState } from "react";
import { Button, StatusSwitch } from "../components/os/controls";
import {
  createCustomSheet,
  type usePreferences,
} from "../application/usePreferences";
import {
  accentOptions,
  cssLimit,
  displayDefaults,
  textOptions,
  themeOptions,
  type Preferences,
} from "../repositories/localPreferences";

export const preferencesPath = "/app/settings/preferences";
export const preferencesSafePath = `${preferencesPath}/safe`;

export function PreferencesPage({
  preferences,
  updatePreferences,
  safeMode,
}: ReturnType<typeof usePreferences> & { safeMode: boolean }) {
  const cssId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [cssMessage, setCssMessage] = useState("");
  const css = draft ?? preferences.css;

  function updateDisplay(patch: Partial<Preferences>) {
    setMessage(
      updatePreferences(patch)
        ? "Preferências salvas."
        : "Não foi possível salvar neste navegador.",
    );
  }

  function updateCss(code: string, enabled: boolean) {
    if (code && (enabled || code !== preferences.css)) {
      try {
        createCustomSheet(code);
      } catch (error) {
        setCssMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível ler o CSS.",
        );
        return false;
      }
    }
    if (!updatePreferences({ css: code, cssEnabled: enabled })) {
      setCssMessage("Não foi possível salvar o CSS neste navegador.");
      return false;
    }
    setCssMessage(
      enabled
        ? "CSS salvo e aplicado."
        : code
          ? "CSS desativado. O código continua salvo."
          : "CSS removido.",
    );
    return true;
  }

  return (
    <>
      <section className="os-section">
        <div className="os-section-head">
          <div>
            <h2>Personalização</h2>
            <p>Os ajustes valem para todos os workspaces neste navegador.</p>
          </div>
        </div>
        <div className="os-preference-list">
          <PreferenceSelect
            label="Tema"
            value={preferences.theme}
            options={themeOptions}
            onChange={(theme) => updateDisplay({ theme })}
          />
          <PreferenceSelect
            label="Cor de destaque"
            value={preferences.accent}
            options={accentOptions}
            onChange={(accent) => updateDisplay({ accent })}
          />
        </div>
      </section>

      <section className="os-section">
        <div className="os-section-head">
          <div>
            <h2>Acessibilidade</h2>
            <p>Ajuste a leitura e o movimento da interface.</p>
          </div>
        </div>
        <div className="os-preference-list">
          <PreferenceSelect
            label="Tamanho do texto"
            value={preferences.textSize}
            options={textOptions}
            onChange={(textSize) => updateDisplay({ textSize })}
          />
          <div className="os-preference-row">
            <div>
              <strong>Alto contraste</strong>
              <small>Reforça o contraste do texto, das bordas e do foco.</small>
            </div>
            <StatusSwitch
              label="Alto contraste"
              checked={preferences.highContrast}
              onChange={() =>
                updateDisplay({ highContrast: !preferences.highContrast })
              }
            />
          </div>
          <div className="os-preference-row">
            <div>
              <strong>Reduzir movimento</strong>
              <small>
                Desativa as animações da interface. A preferência do sistema
                também é respeitada.
              </small>
            </div>
            <StatusSwitch
              label="Reduzir movimento"
              checked={preferences.reduceMotion}
              onChange={() =>
                updateDisplay({ reduceMotion: !preferences.reduceMotion })
              }
            />
          </div>
        </div>
      </section>

      <div className="os-preference-actions">
        <Button onClick={() => updateDisplay(displayDefaults)}>
          Restaurar tema e acessibilidade
        </Button>
        <span role="status">{message}</span>
      </div>

      <section className="os-section os-css-settings">
        <div className="os-section-head">
          <div>
            <h2>CSS personalizado</h2>
            <p>Adicione regras para personalizar a interface do SymOS.</p>
          </div>
        </div>
        {safeMode ? (
          <p role="status" className="os-preference-notice">
            Modo de recuperação ativo. O CSS está suspenso nesta página. Use o
            interruptor para desativá-lo ao sair ou salve o código corrigido.
          </p>
        ) : (
          <p className="os-muted">
            Se uma regra impedir o acesso às configurações, abra o{" "}
            <a href={`#${preferencesSafePath}`}>modo de recuperação</a>.
          </p>
        )}
        <div className="os-preference-row">
          <div>
            <strong>Ativar CSS salvo</strong>
            <small>Desative para voltar ao tema sem apagar seu código.</small>
          </div>
          <StatusSwitch
            label="Ativar CSS salvo"
            checked={preferences.cssEnabled}
            disabled={
              !preferences.css.trim() || (safeMode && !preferences.cssEnabled)
            }
            onChange={() => updateCss(preferences.css, !preferences.cssEnabled)}
          />
        </div>
        <form
          className="os-preference-list"
          onSubmit={(event) => {
            event.preventDefault();
            const code = css.trim() ? css : "";
            if (updateCss(code, !safeMode && !!code)) setDraft(null);
          }}
        >
          <label htmlFor={cssId}>
            <strong>Código CSS</strong>
          </label>
          <textarea
            id={cssId}
            className="os-css-editor"
            value={css}
            maxLength={cssLimit}
            onChange={(event) => setDraft(event.target.value)}
            placeholder=".os-page-header { letter-spacing: 0.02em; }"
            aria-describedby={`${cssId}-help`}
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
          />
          <small id={`${cssId}-help`} className="os-muted">
            Até 20 mil caracteres. Regras @import não são carregadas.
          </small>
          <div className="os-preference-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={css === preferences.css}
            >
              {safeMode ? "Salvar com CSS desativado" : "Salvar e aplicar CSS"}
            </Button>
            <span role="status">{cssMessage}</span>
          </div>
        </form>
      </section>
    </>
  );
}

function PreferenceSelect<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Value;
  options: Record<Value, string>;
  onChange: (value: Value) => void;
}) {
  const id = useId();
  return (
    <div className="os-preference-row">
      <label htmlFor={id}>
        <strong>{label}</strong>
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as Value)}
      >
        {Object.entries(options).map(([key, name]) => (
          <option key={key} value={key}>
            {name as string}
          </option>
        ))}
      </select>
    </div>
  );
}
