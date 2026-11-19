import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { SupabaseWorkspace, WorkspaceAccess } from "./app/SupabaseWorkspace";
import "./styles/index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
const render = (app: React.ReactNode) =>
  root.render(<React.StrictMode>{app}</React.StrictMode>);
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

async function start() {
  if (!url && !key) {
    render(<App />);
    return;
  }

  try {
    if (!url || !key?.startsWith("sb_publishable_")) throw new Error();
    render(
      <WorkspaceAccess title="Conectando ao Supabase">
        <p role="status">Aguarde um instante.</p>
      </WorkspaceAccess>,
    );
    const { createClient } = await import("@supabase/supabase-js");
    render(<SupabaseWorkspace client={createClient(url, key)} />);
  } catch {
    render(
      <WorkspaceAccess title="Não foi possível conectar ao Supabase">
        <p role="alert">
          Confira a conexão, a URL do projeto e a chave pública publishable.
        </p>
        <button className="os-button" onClick={() => location.reload()}>
          Recarregar
        </button>
      </WorkspaceAccess>,
    );
  }
}

void start();
