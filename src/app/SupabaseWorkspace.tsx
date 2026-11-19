import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { openSupabaseDatabase } from "../repositories/supabaseDatabase";
import App from "./App";
import { TurnstileChallenge } from "./TurnstileChallenge";
import { Button } from "../components/os/controls";

export function WorkspaceAccess({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="os-onboarding">
      <section className="os-onboarding-form os-access">
        <div className="os-onboarding-brand">
          sym<span>OS</span>
        </div>
        <div className="os-onboarding-content">
          <h1>{title}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}

export function SupabaseWorkspace({ client }: { client: SupabaseClient }) {
  const [session, setSession] = useState<Session | null>();
  useEffect(() => {
    const { data: listener } = client.auth.onAuthStateChange((_, active) => {
      setSession(active);
    });
    return () => listener.subscription.unsubscribe();
  }, [client]);

  if (session === undefined) {
    return (
      <WorkspaceAccess title="Verificando sua sessão">
        <p role="status">Aguarde um instante.</p>
      </WorkspaceAccess>
    );
  }
  if (session) {
    return (
      <AccountWorkspace
        key={session.user.id}
        client={client}
        user={session.user}
      />
    );
  }
  return <AccessForm client={client} />;
}

const turnstileSiteKey = import.meta.env?.VITE_TURNSTILE_SITE_KEY?.trim();
const captchaError = "A verificação de segurança falhou. Atualize a página e tente de novo.";

const signupErrors: Record<string, string> = {
  captcha_failed: captchaError,
  signup_disabled: "O cadastro de novas contas está desativado.",
  email_provider_disabled: "O cadastro por e-mail está desativado.",
  weak_password: "Escolha uma senha que atenda aos requisitos de segurança.",
  email_address_not_authorized:
    "O serviço de e-mail ainda não está configurado para enviar a confirmação a este endereço.",
  over_email_send_rate_limit:
    "O limite de envios de e-mail foi atingido. Tente novamente mais tarde.",
  over_request_rate_limit:
    "Houve muitas tentativas. Tente novamente mais tarde.",
};

function AccessForm({ client }: { client: SupabaseClient }) {
  const [mode, setMode] = useState<"login" | "signup" | "confirm">("login");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const signup = mode === "signup";
  const passwordMinimum = 6;

  function switchMode(next: "login" | "signup") {
    setCaptchaToken("");
    setMode(next);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || (turnstileSiteKey && !captchaToken)) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const address = email.trim();
    setError("");
    if (signup && password.length < passwordMinimum) {
      setError(`A senha deve ter pelo menos ${passwordMinimum} caracteres.`);
      return;
    }
    if (signup && form.get("confirmation") !== password) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setPending(true);
    try {
      if (signup) {
        const { data, error: failure } = await client.auth.signUp({
          email: address,
          password,
          options: {
            ...(captchaToken ? { captchaToken } : {}),
            emailRedirectTo: new URL(location.pathname, location.origin).href,
          },
        });
        if (failure) {
          setError(
            signupErrors[failure.code ?? ""] ??
              "Não foi possível criar a conta. Confira os dados e tente de novo.",
          );
        } else if (!data.session) {
          setMode("confirm");
        }
      } else {
        const { error: failure } = await client.auth.signInWithPassword({
          email: address,
          password,
          ...(captchaToken ? { options: { captchaToken } } : {}),
        });
        if (failure) {
          setError(
            failure.code === "invalid_credentials"
              ? "Confira o e-mail e a senha e tente de novo."
              : failure.code === "email_not_confirmed"
                ? "Confirme seu e-mail antes de entrar."
                : failure.code === "captcha_failed"
                  ? captchaError
                  : "Não foi possível entrar no SymOS. Tente de novo.",
          );
        }
      }
    } catch {
      setError("Não foi possível conectar ao Supabase. Tente de novo.");
    } finally {
      if (turnstileSiteKey) {
        setCaptchaToken("");
        setCaptchaAttempt((value) => value + 1);
      }
      setPending(false);
    }
  }

  if (mode === "confirm") {
    return (
      <WorkspaceAccess title="Confirme seu e-mail">
        <p role="status">
          Confira a caixa de entrada de <strong>{email.trim()}</strong> e abra o
          link de confirmação para concluir o cadastro.
        </p>
        <Button onClick={() => switchMode("login")}>Voltar para o login</Button>
      </WorkspaceAccess>
    );
  }

  return (
    <WorkspaceAccess
      title={signup ? "Criar conta no SymOS" : "Entrar no SymOS"}
    >
      <form key={mode} className="os-field-stack" onSubmit={submit}>
        <label>
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Senha
          <input
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            minLength={signup ? passwordMinimum : undefined}
            aria-describedby={signup ? "auth-password-hint" : undefined}
            required
          />
          {signup && (
            <small id="auth-password-hint">
              Use pelo menos {passwordMinimum} caracteres.
            </small>
          )}
        </label>
        {signup && (
          <label>
            Confirmar senha
            <input
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
            />
          </label>
        )}
        {turnstileSiteKey && (
          <TurnstileChallenge
            key={captchaAttempt}
            siteKey={turnstileSiteKey}
            onToken={setCaptchaToken}
          />
        )}
        {error && (
          <p className="os-validation" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={pending || Boolean(turnstileSiteKey && !captchaToken)}
        >
          {signup
            ? pending
              ? "Criando conta…"
              : "Criar conta"
            : pending
              ? "Entrando…"
              : "Entrar"}
        </Button>
      </form>
      <div className="os-access-switch">
        <span>{signup ? "Já tem uma conta?" : "Ainda não tem conta?"}</span>
        <Button
          variant="link"
          disabled={pending}
          onClick={() => switchMode(signup ? "login" : "signup")}
        >
          {signup ? "Entrar" : "Criar conta"}
        </Button>
      </div>
    </WorkspaceAccess>
  );
}

function AccountWorkspace({
  client,
  user,
}: {
  client: SupabaseClient;
  user: User;
}) {
  const { id, email } = user;
  const [workspace, setWorkspace] =
    useState<Awaited<ReturnType<typeof openSupabaseDatabase>>>();
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [signOutError, setSignOutError] = useState(false);
  useEffect(() => {
    let active = true;
    void openSupabaseDatabase(client, { id, email }).then(
      (result) => {
        if (active) setWorkspace(result);
      },
      () => {
        if (active) setLoadError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [client, id, email, attempt]);

  const signOut = async () => {
    setSignOutError(false);
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch {
      setSignOutError(true);
    }
  };

  if (!workspace) {
    return (
      <WorkspaceAccess
        title={
          loadError
            ? "Não foi possível abrir o workspace"
            : "Carregando seu workspace"
        }
      >
        {loadError ? (
          <>
            <p role="alert">
              Verifique a conexão e a instalação da migração do SymOS no
              Supabase.
            </p>
            <div className="os-action-row">
              <button
                className="os-button primary"
                onClick={() => {
                  setLoadError(false);
                  setAttempt(attempt + 1);
                }}
              >
                Tentar de novo
              </button>
              <button className="os-button" onClick={signOut}>
                Sair
              </button>
            </div>
            {signOutError && (
              <p role="alert">Não foi possível sair. Tente de novo.</p>
            )}
          </>
        ) : (
          <p role="status">Buscando seus dados no Supabase.</p>
        )}
      </WorkspaceAccess>
    );
  }

  return (
    <App
      repository={workspace.repository}
      accountReady={workspace.ready}
      signOut={signOut}
      accountError={
        signOutError ? "Não foi possível sair. Tente de novo." : undefined
      }
    />
  );
}
