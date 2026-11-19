import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    size: "flexible";
    language: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  remove: (id: string) => void;
};

const browser = window as Window & { turnstile?: Turnstile };
let loading: Promise<Turnstile> | undefined;

function loadTurnstile() {
  if (browser.turnstile) return Promise.resolve(browser.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const fail = () => {
      script.remove();
      loading = undefined;
      reject(new Error("Turnstile indisponível"));
    };
    script.onload = () => {
      if (browser.turnstile) resolve(browser.turnstile);
      else fail();
    };
    script.onerror = fail;
    document.head.append(script);
  });
  return loading;
}

export function TurnstileChallenge({ siteKey, onToken }: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let removeWidget: (() => void) | undefined;
    void loadTurnstile().then((turnstile) => {
      if (!active || !container.current) return;
      const id = turnstile.render(container.current, {
        sitekey: siteKey,
        size: "flexible",
        language: "pt-br",
        callback: (token) => {
          if (!active) return;
          setFailed(false);
          onToken(token);
        },
        "expired-callback": () => {
          if (active) onToken("");
        },
        "error-callback": () => {
          if (!active) return;
          onToken("");
          setFailed(true);
        },
      });
      removeWidget = () => turnstile.remove(id);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
      removeWidget?.();
    };
  }, [siteKey, onToken, attempt]);

  return (
    <div>
      <div ref={container} />
      {failed && (
        <div role="alert">
          <p className="os-validation">Não foi possível concluir a verificação de segurança.</p>
          <button type="button" className="os-button" onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}>
            Tentar verificação de novo
          </button>
        </div>
      )}
    </div>
  );
}
