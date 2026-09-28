import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

type Step = { target: string; title: string; text: string; route?: string };

export function Tutorial({
  projectId,
  navigate,
  close,
}: {
  projectId?: string;
  navigate: (path: string) => void;
  close: () => void;
}) {
  const steps: Step[] = [
    {
      target: '[data-tour="dashboard"]',
      route: "/app",
      title: "Comece pela visão geral",
      text: "Os números são calculados a partir dos projetos. Assim, cada tarefa concluída atualiza o progresso e os indicadores.",
    },
    {
      target:
        window.innerWidth < 768
          ? '[data-tour="mobile-menu"]'
          : '[data-tour="portfolio"]',
      route: "/app",
      title: "Veja todo o portfólio",
      text:
        window.innerWidth < 768
          ? "Abra o menu para acessar o portfólio. Lá você alterna entre cards, tabela, Kanban e timeline, com filtros que mudam os resultados na hora."
          : "Abra o portfólio para alternar entre cards, tabela, Kanban e timeline. Os filtros mudam os resultados na hora.",
    },
    {
      target: '[data-tour="new-project"]',
      route: "/app",
      title: "Dê forma a uma ideia",
      text: "Crie um projeto com template ou em branco. Escolha pessoas, metodologia e módulos conforme o contexto.",
    },
    {
      target: '[data-tour="search"]',
      route: "/app",
      title: "Encontre o contexto",
      text: "A busca local encontra projetos, tarefas, clientes, documentos e pessoas. Use Ctrl ou ⌘ + K para abri-la.",
    },
    {
      target: '[data-tour="project-tabs"]',
      route: projectId ? `/app/projects/${projectId}` : "/app/projects",
      title: "Execute e preserve decisões",
      text: "No projeto, edite tarefas, mova cards no Kanban, registre comentários, riscos e decisões. O histórico acompanha as mudanças.",
    },
  ];
  const [index, setIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = steps[index];

  useLayoutEffect(() => {
    let frame = 0;
    const measure = () => {
      const target = document.querySelector<HTMLElement>(current.target);
      if (!target || !target.getClientRects().length) {
        setSpotlight(null);
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setSpotlight(target.getBoundingClientRect()),
      );
    };
    document
      .querySelector<HTMLElement>(current.target)
      ?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index, current.target]);

  useEffect(() => {
    heading.current?.focus();
  }, [index]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [close]);

  const go = (next: number) => {
    setIndex(next);
    if (steps[next].route) navigate(steps[next].route!);
  };
  const top = spotlight
    ? Math.min(window.innerHeight, Math.max(0, spotlight.top - 6))
    : 0;
  const left = spotlight
    ? Math.min(window.innerWidth, Math.max(0, spotlight.left - 6))
    : 0;
  const right = spotlight
    ? Math.min(window.innerWidth, Math.max(left, spotlight.right + 6))
    : 0;
  const bottom = spotlight
    ? Math.min(window.innerHeight, Math.max(top, spotlight.bottom + 6))
    : 0;
  return (
    <div className="os-tour-layer">
      {spotlight ? (
        <>
          <div
            className="os-tour-shade"
            aria-hidden="true"
            style={{ top: 0, left: 0, right: 0, height: top }}
          />
          <div
            className="os-tour-shade"
            aria-hidden="true"
            style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="os-tour-shade"
            aria-hidden="true"
            style={{ top, left: 0, width: left, height: bottom - top }}
          />
          <div
            className="os-tour-shade"
            aria-hidden="true"
            style={{ top, left: right, right: 0, height: bottom - top }}
          />
        </>
      ) : (
        <div
          className="os-tour-shade"
          aria-hidden="true"
          style={{ inset: 0 }}
        />
      )}
      {spotlight && (
        <div
          className="os-tour-spotlight"
          aria-hidden="true"
          style={{
            top: spotlight.top - 6,
            left: spotlight.left - 6,
            width: spotlight.width + 12,
            height: spotlight.height + 12,
          }}
        />
      )}
      <section
        className="os-tour-card"
        role="dialog"
        aria-label="Tutorial do SymOS"
        aria-modal="false"
      >
        <header>
          <span>
            TUTORIAL · {String(index + 1).padStart(2, "0")} /{" "}
            {String(steps.length).padStart(2, "0")}
          </span>
          <button onClick={close} aria-label="Fechar tutorial">
            <X size={18} />
          </button>
        </header>
        <div key={index} className="os-tour-body">
          <h2 ref={heading} tabIndex={-1}>
            {current.title}
          </h2>
          <p>{current.text}</p>
        </div>
        <div
          className="os-tour-dots"
          aria-label={`Passo ${index + 1} de ${steps.length}`}
        >
          {steps.map((_, step) => (
            <span key={step} className={step === index ? "active" : ""} />
          ))}
        </div>
        <footer>
          <button className="os-text-action" onClick={close}>
            Pular tutorial
          </button>
          <div>
            {index > 0 && (
              <button className="os-button" onClick={() => go(index - 1)}>
                <ArrowLeft size={15} /> Voltar
              </button>
            )}
            {index < steps.length - 1 ? (
              <button
                className="os-button primary"
                onClick={() => go(index + 1)}
              >
                Próximo <ArrowRight size={15} />
              </button>
            ) : (
              <button className="os-button primary" onClick={close}>
                Concluir <Check size={15} />
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
