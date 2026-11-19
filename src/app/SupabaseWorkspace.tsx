import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { openSupabaseDatabase } from "../repositories/supabaseDatabase";
import App from "./App";

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
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const { data: listener } = client.auth.onAuthStateChange((_, active) => {
      setSession(active);
    });
    return () => listener.subscription.unsubscribe();
  }, [client]);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const { error: failure } = await client.auth.signInWithPassword({
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      });
      if (failure) {
        setError(
          failure.code === "invalid_credentials"
            ? "Confira o e-mail e a senha e tente de novo."
            : "Não foi possível entrar no SymOS. Tente de novo.",
        );
      }
    } catch {
      setError("Não foi possível conectar ao Supabase. Tente de novo.");
    } finally {
      setPending(false);
    }
  };

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
  return (
    <WorkspaceAccess title="Entrar no SymOS">
      <form className="os-field-stack" onSubmit={signIn}>
        <label>
          E-mail
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Senha
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="os-validation" role="alert">
            {error}
          </p>
        )}
        <button className="os-button primary" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
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
