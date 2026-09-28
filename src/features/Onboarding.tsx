import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Fingerprint,
  Layers3,
  Sparkles,
} from "lucide-react";
import type { OnboardingProfile } from "../repositories/localOnboarding";

type Props = {
  initial: OnboardingProfile;
  finish: (profile: OnboardingProfile) => void;
  explore: () => void;
};

const benefits = [
  {
    icon: Compass,
    title: "Enxergue o todo",
    text: "Projetos, responsáveis e prazos em contexto.",
  },
  {
    icon: Layers3,
    title: "Conecte a execução",
    text: "Tarefas, etapas e decisões no mesmo fluxo.",
  },
  {
    icon: Fingerprint,
    title: "Preserve o porquê",
    text: "Histórico e aprovações junto do trabalho.",
  },
];

export function Onboarding({ initial, finish, explore }: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
  ) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setError("");
  };
  const next = (event: FormEvent) => {
    event.preventDefault();
    if (step === 1 && (!profile.name.trim() || !profile.role.trim())) {
      setError("Informe seu nome e sua função para continuar.");
      return;
    }
    if (step === 2 && !profile.organization.trim()) {
      setError("Dê um nome ao workspace para continuar.");
      return;
    }
    if (step === 2) finish(profile);
    else setStep((current) => current + 1);
  };

  return (
    <main className="os-onboarding">
      <div className="os-onboarding-grid">
        <section className="os-onboarding-story">
          <div className="os-onboarding-brand">
            sym<span>OS</span>
            <small>por symco</small>
          </div>
          <div className="os-story-body">
            <span className="os-eyebrow">
              <Sparkles size={14} /> SEU ESPAÇO DE TRABALHO COMEÇA AQUI
            </span>
            <h1>Uma ideia merece mais que uma lista de tarefas.</h1>
            <p>
              Transforme contexto em decisões, decisões em execução e execução
              em resultados. Tudo com clareza para quem faz parte do projeto.
            </p>
            <div className="os-story-preview" aria-hidden="true">
              <div className="os-preview-head">
                <span />
                <span />
                <span />
              </div>
              <div className="os-preview-track">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="os-preview-bars">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
          <small className="os-story-caption">
            SYMOS · INTELIGÊNCIA + GOVERNANÇA + EXECUÇÃO
          </small>
        </section>
        <section className="os-onboarding-form">
          <div
            className="os-onboarding-progress"
            aria-label={`Etapa ${step + 1} de 3`}
          >
            {[0, 1, 2].map((item) => (
              <span key={item} className={item <= step ? "active" : ""} />
            ))}
          </div>
          <div className="os-onboarding-content" key={step}>
            {step === 0 && (
              <>
                <span className="os-step-label">01 / BOAS-VINDAS</span>
                <h2>Bem-vindo ao seu sistema de projetos.</h2>
                <p>
                  Antes de começar, vamos conhecer seu contexto para deixar o
                  espaço mais útil. Você também pode explorar a demonstração
                  agora.
                </p>
                <div className="os-benefits">
                  {benefits.map(({ icon: Icon, title, text }) => (
                    <div key={title}>
                      <span>
                        <Icon size={19} />
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <small>{text}</small>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="os-button primary os-onboarding-cta"
                  onClick={() => setStep(1)}
                >
                  Configurar meu espaço <ArrowRight size={17} />
                </button>
                <button className="os-text-action" onClick={explore}>
                  Explorar a demonstração
                </button>
              </>
            )}
            {step === 1 && (
              <form onSubmit={next}>
                <span className="os-step-label">02 / SOBRE VOCÊ</span>
                <h2>Quem vai conduzir os projetos?</h2>
                <p>
                  Essas informações personalizam a experiência neste navegador.
                </p>
                <div className="os-field-stack">
                  <label>
                    Seu nome <span>*</span>
                    <input
                      autoFocus
                      value={profile.name}
                      onChange={(event) => set("name", event.target.value)}
                      placeholder="Como você gostaria de ser chamado?"
                    />
                  </label>
                  <label>
                    Sua função <span>*</span>
                    <input
                      value={profile.role}
                      onChange={(event) => set("role", event.target.value)}
                      placeholder="Ex.: Gerente de projetos"
                    />
                  </label>
                  <label>
                    E-mail <small>opcional</small>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(event) => set("email", event.target.value)}
                      placeholder="voce@empresa.com"
                    />
                  </label>
                </div>
                {error && (
                  <p className="os-validation" role="alert">
                    {error}
                  </p>
                )}
                <div className="os-step-actions">
                  <button
                    type="button"
                    className="os-button"
                    onClick={() => setStep(0)}
                  >
                    <ArrowLeft size={15} /> Voltar
                  </button>
                  <button className="os-button primary">
                    Continuar <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}
            {step === 2 && (
              <form onSubmit={next}>
                <span className="os-step-label">03 / SEU CONTEXTO</span>
                <h2>Onde o trabalho acontece?</h2>
                <p>
                  Escolha o tipo de espaço. Você poderá alternar entre
                  workspaces no aplicativo.
                </p>
                <div
                  className="os-onboarding-options"
                  role="group"
                  aria-label="Tipo de workspace"
                >
                  <button
                    type="button"
                    className={
                      profile.workspaceType === "symco" ? "chosen" : ""
                    }
                    onClick={() => set("workspaceType", "symco")}
                  >
                    <strong>Ecossistema Symco</strong>
                    <small>
                      Projetos com módulos e metodologia de food tech.
                    </small>
                  </button>
                  <button
                    type="button"
                    className={
                      profile.workspaceType === "independent" ? "chosen" : ""
                    }
                    onClick={() => set("workspaceType", "independent")}
                  >
                    <strong>Espaço independente</strong>
                    <small>
                      Ferramentas centrais do SymOS, com seu próprio fluxo.
                    </small>
                  </button>
                </div>
                <div className="os-field-stack">
                  <label>
                    Nome do workspace <span>*</span>
                    <input
                      value={profile.organization}
                      onChange={(event) =>
                        set("organization", event.target.value)
                      }
                      placeholder="Empresa, equipe ou projeto pessoal"
                    />
                  </label>
                  <label>
                    Segmento <small>opcional</small>
                    <input
                      value={profile.segment}
                      onChange={(event) => set("segment", event.target.value)}
                      placeholder="Ex.: Alimentos e bebidas"
                    />
                  </label>
                  <label>
                    Objetivo principal <small>opcional</small>
                    <select
                      value={profile.goal}
                      onChange={(event) => set("goal", event.target.value)}
                    >
                      <option value="">Selecione</option>
                      <option value="portfolio">Acompanhar o portfólio</option>
                      <option value="execution">Organizar a execução</option>
                      <option value="governance">
                        Fortalecer a governança
                      </option>
                    </select>
                  </label>
                </div>
                <p className="os-privacy-note">
                  <Check size={14} /> Neste protótipo, as informações ficam
                  apenas neste navegador. Nenhuma identidade é verificada.
                </p>
                {error && (
                  <p className="os-validation" role="alert">
                    {error}
                  </p>
                )}
                <div className="os-step-actions">
                  <button
                    type="button"
                    className="os-button"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft size={15} /> Voltar
                  </button>
                  <button className="os-button primary">
                    Entrar no SymOS <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="os-onboarding-footer">
            {step === 0
              ? "Seu contexto, do primeiro passo ao próximo marco."
              : `Etapa ${step + 1} de 3`}
          </div>
        </section>
      </div>
    </main>
  );
}
