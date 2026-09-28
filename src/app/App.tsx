import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useWorkspace } from "../application/useWorkspace";
import { modules } from "../domain/catalog";
import { Dashboard } from "../features/Dashboard";
import { Portfolio } from "../features/Portfolio";
import { ProjectDetail } from "../features/ProjectDetail";
import { NewProject } from "../features/NewProject";
import { Governance } from "../features/Governance";

const navigation = [
  {
    heading: "VISÃO GERAL",
    links: [{ label: "Dashboard", path: "/app", icon: LayoutDashboard }],
  },
  {
    heading: "GESTÃO",
    links: [
      { label: "Portfólio", path: "/app/portfolio", icon: FolderKanban },
      { label: "Projetos", path: "/app/projects", icon: FolderKanban },
      { label: "Cronograma", path: "/app/calendar", icon: CalendarDays },
      { label: "Documentos", path: "/app/documents", icon: FileText },
    ],
  },
  {
    heading: "GOVERNANÇA",
    links: [
      { label: "Aprovações", path: "/app/approvals", icon: ShieldCheck },
      { label: "Riscos", path: "/app/risks", icon: Activity },
      { label: "Decisões", path: "/app/decisions", icon: CheckCircle2 },
    ],
  },
  {
    heading: "SISTEMA",
    links: [{ label: "Configurações", path: "/app/settings", icon: Settings }],
  },
];

export default function App() {
  const actions = useWorkspace();
  const { database } = actions;
  const [path, setPath] = useState(
    location.pathname === "/" ? "/app" : location.pathname,
  );
  const [workspaceId, setWorkspaceId] = useState(
    () => localStorage.getItem("symos-workspace") || "symco",
  );
  const [sidebar, setSidebar] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const workspace =
    database.workspaces.find((item) => item.id === workspaceId) ||
    database.workspaces[0];
  const projects = database.projects.filter(
    (project) => project.workspaceId === workspace.id,
  );
  const navigate = (next: string) => {
    history.pushState({}, "", next);
    setPath(next);
    setMobileNav(false);
    setSearchOpen(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onPop = () => setPath(location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
        window.setTimeout(
          () =>
            document.querySelector<HTMLInputElement>("#global-search")?.focus(),
          0,
        );
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileNav(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const selectWorkspace = (value: string) => {
    setWorkspaceId(value);
    localStorage.setItem("symos-workspace", value);
    navigate("/app");
  };
  const projectId =
    path === "/app/projects/new"
      ? undefined
      : path.match(/^\/app\/projects\/([^/]+)/)?.[1];
  const project = database.projects.find(
    (item) => item.id === projectId && item.workspaceId === workspace.id,
  );
  const matches = search.trim()
    ? [
        ...projects
          .filter((item) =>
            `${item.name} ${item.description}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            type: "Projeto",
            path: `/app/projects/${item.id}`,
          })),
        ...database.tasks
          .filter(
            (item) =>
              projects.some((project) => project.id === item.projectId) &&
              item.title.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.title,
            type: "Tarefa",
            path: `/app/projects/${item.projectId}`,
          })),
        ...database.clients
          .filter(
            (item) =>
              item.workspaceId === workspace.id &&
              item.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            type: "Cliente",
            path: "/app/portfolio",
          })),
        ...database.attachments
          .filter(
            (item) =>
              projects.some((project) => project.id === item.projectId) &&
              item.title.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.title,
            type: "Documento",
            path: `/app/projects/${item.projectId}`,
          })),
        ...database.users
          .filter(
            (item) =>
              workspace.memberIds.includes(item.id) &&
              item.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            type: "Pessoa",
            path: "/app/settings",
          })),
      ].slice(0, 8)
    : [];
  const title =
    path === "/app"
      ? "Visão Geral"
      : path === "/app/portfolio"
        ? "Portfólio de Projetos"
        : path === "/app/projects/new"
          ? "Criar novo projeto"
          : path === "/app/projects"
            ? "Projetos"
            : project
              ? project.name
              : navigation
                  .flatMap((group) => group.links)
                  .find((link) => link.path === path)?.label ||
                "Página não encontrada";

  return (
    <div className={`os-shell ${sidebar ? "" : "os-collapsed"}`}>
      <aside className={`os-sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="os-brand">
          <span>
            sym<span>OS</span>
          </span>
          <small>por symco</small>
        </div>
        <nav aria-label="Navegação principal">
          {navigation.map((group) => (
            <div className="os-nav-group" key={group.heading}>
              <small>{group.heading}</small>
              {group.links.map(({ label, path: target, icon: Icon }) => (
                <button
                  key={target}
                  title={label}
                  className={
                    path === target || (target === "/app/projects" && !!project)
                      ? "selected"
                      : ""
                  }
                  onClick={() => navigate(target)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="os-modules">
          <small>MÓDULOS SYMCO</small>
          {modules
            .filter((module) => workspace.moduleIds.includes(module.id))
            .map((module) => (
              <div title={module.description} key={module.id}>
                <span className="module-mark">✦</span>
                <span>{module.name}</span>
              </div>
            ))}
        </div>
        <div className="os-sidebar-bottom">
          <button
            onClick={() => setSidebar((value) => !value)}
            aria-label="Recolher ou expandir navegação"
          >
            <ChevronLeft size={17} />
            <span>Recolher menu</span>
          </button>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="os-scrim"
          aria-label="Fechar menu"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="os-workspace">
        <header className="os-topbar">
          <button
            className="os-mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={21} />
          </button>
          <label className="os-workspace-select">
            <span className="workspace-icon">S</span>
            <select
              aria-label="Workspace"
              value={workspace.id}
              onChange={(event) => selectWorkspace(event.target.value)}
            >
              {database.workspaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="os-search-wrap">
            <label className="os-search">
              <Search size={16} />
              <input
                id="global-search"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar projetos, tarefas, pessoas..."
                aria-label="Busca global"
              />
              <kbd>⌘ K</kbd>
            </label>
            {searchOpen && (
              <div className="os-search-popover">
                {matches.length ? (
                  matches.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        navigate(item.path);
                        setSearch("");
                      }}
                    >
                      <span>{item.name}</span>
                      <small>{item.type}</small>
                    </button>
                  ))
                ) : (
                  <p>
                    {search
                      ? "Nenhum resultado encontrado."
                      : "Busque em projetos, tarefas, clientes, documentos e pessoas."}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            className="os-icon-button"
            aria-label="Notificações"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell size={18} />
          </button>
          <div className="os-user">
            <span className="os-avatar">MC</span>
            <span>
              Mariana Costa<small>Gestora de projetos</small>
            </span>
          </div>
        </header>
        {notificationsOpen && (
          <div className="os-notifications">
            <strong>Atividades recentes</strong>
            {database.activities
              .filter((item) => item.workspaceId === workspace.id)
              .slice(0, 5)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(`/app/projects/${item.projectId}`);
                    setNotificationsOpen(false);
                  }}
                >
                  {item.summary}
                </button>
              ))}
          </div>
        )}
        <main className="os-main">
          <div className="os-page-header">
            <div>
              <small>SYMOS / {workspace.name.toUpperCase()}</small>
              <h1>{title}</h1>
              {!project && (
                <p>Inteligência, governança e execução em um só lugar.</p>
              )}
            </div>
            {path !== "/app/projects/new" && (
              <button
                className="os-button primary"
                onClick={() => navigate("/app/projects/new")}
              >
                <Plus size={16} /> Novo projeto
              </button>
            )}
          </div>
          {path === "/app" && (
            <Dashboard
              database={database}
              projects={projects}
              navigate={navigate}
            />
          )}
          {(path === "/app/portfolio" || path === "/app/projects") && (
            <Portfolio
              database={database}
              projects={projects}
              navigate={navigate}
            />
          )}
          {path === "/app/projects/new" && (
            <NewProject
              database={database}
              workspace={workspace}
              create={actions.createProject}
              navigate={navigate}
            />
          )}
          {project && (
            <ProjectDetail
              key={project.id}
              database={database}
              project={project}
              actions={actions}
              navigate={navigate}
            />
          )}
          {[
            "/app/calendar",
            "/app/documents",
            "/app/approvals",
            "/app/risks",
            "/app/decisions",
            "/app/settings",
          ].includes(path) && (
            <Governance
              path={path}
              database={database}
              projects={projects}
              actions={actions}
              navigate={navigate}
            />
          )}
          {!project && projectId && (
            <div className="os-empty">
              <h2>Projeto não encontrado</h2>
              <p>Verifique o workspace selecionado.</p>
              <button
                className="os-button primary"
                onClick={() => navigate("/app/projects")}
              >
                Ver projetos
              </button>
            </div>
          )}
        </main>
        {actions.error && (
          <div className="os-error" role="alert">
            {actions.error}
            <button onClick={actions.dismissError} aria-label="Fechar">
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
