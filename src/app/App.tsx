import { Button } from "../components/os/controls";
import { useEffect, useState } from "react";
import {
  Zap,
  BarChart3,
  Bell,
  ChevronLeft,
  Compass,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Plus,
  LogOut,
  CircleHelp,
  Search,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { usePreferences } from "../application/usePreferences";
import { useWorkspace } from "../application/useWorkspace";
import { modules } from "../domain/catalog";
import { Dashboard } from "../features/Dashboard";
import { Portfolio } from "../features/Portfolio";
import { ProjectDetail } from "../features/ProjectDetail";
import { NewProject } from "../features/NewProject";
import { Documents } from "../features/Documents";
import { Automations } from "../features/Automations";
import { Reports } from "../features/Reports";
import {
  SettingsPage,
  settingsPath,
  settingsSection,
} from "../features/SettingsPage";
import { preferencesSafePath } from "../features/PreferencesPage";
import {
  Governance,
  governancePath,
  governanceSection,
} from "../features/Governance";
import { Onboarding } from "../features/Onboarding";
import { Tutorial } from "../features/Tutorial";
import {
  initialOnboarding,
  loadOnboarding,
  saveOnboarding,
  type OnboardingProfile,
} from "../repositories/localOnboarding";

import type { DatabaseRepository } from "../repositories/databaseRepository";

const navigation = [
  {
    heading: "VISÃO GERAL",
    links: [{ label: "Visão Geral", path: "/app", icon: LayoutDashboard }],
  },
  {
    heading: "GESTÃO",
    links: [
      { label: "Projetos", path: "/app/projects", icon: FolderKanban },
      { label: "Documentos", path: "/app/documents", icon: FileText },
      { label: "Governança", path: governancePath, icon: ShieldCheck },
    ],
  },
  {
    heading: "SISTEMA",
    links: [
      { label: "Automações", path: "/app/automations", icon: Zap },
      { label: "Relatórios", path: "/app/reports", icon: BarChart3 },
      { label: "Configurações", path: settingsPath, icon: Settings },
    ],
  },
];

export default function App({
  repository,
  accountReady,
  signOut,
  accountError,
}: {
  repository?: DatabaseRepository;
  accountReady?: boolean;
  signOut?: () => void;
  accountError?: string;
} = {}) {
  const actions = useWorkspace(repository);
  const cloud = accountReady !== undefined;
  const { database } = actions;
  const readPath = () =>
    location.hash.startsWith("#/")
      ? location.hash.slice(1)
      : location.pathname.startsWith("/app")
        ? location.pathname
        : accountReady
          ? "/app"
          : "/";
  const [path, setPath] = useState(readPath);
  const governanceTab = governanceSection(path);
  const settingsTab = settingsSection(path);
  const safeMode = path === preferencesSafePath;
  const personalPreferences = usePreferences(safeMode);
  const pagePath = governanceTab
    ? governancePath
    : settingsTab
      ? settingsPath
      : path;
  const currentUser = database.users[0];
  const [workspaceId, setWorkspaceId] = useState(
    () =>
      (!cloud && localStorage.getItem("symos-workspace")) ||
      currentUser.workspaceId ||
      "symco",
  );
  const [sidebar, setSidebar] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(() =>
    cloud
      ? {
          ...initialOnboarding,
          completed: accountReady,
          profile: {
            ...initialOnboarding.profile,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role || "",
            workspaceType:
              workspaceId === "personal"
                ? ("independent" as const)
                : ("symco" as const),
            organization: accountReady
              ? database.workspaces.find((item) => item.id === workspaceId)
                  ?.name || ""
              : "",
          },
        }
      : loadOnboarding(),
  );
  const [tourOpen, setTourOpen] = useState(false);
  const workspace =
    database.workspaces.find((item) => item.id === workspaceId) ||
    database.workspaces[0];
  const projects = database.projects.filter(
    (project) => project.workspaceId === workspace.id,
  );
  const navigate = (next: string) => {
    history.pushState({}, "", `#${next}`);
    setPath(next);
    setMobileNav(false);
    setSearchOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useEffect(() => {
    const onPop = () => setPath(readPath());
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
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
    if (!cloud) localStorage.setItem("symos-workspace", value);
    navigate("/app");
  };
  const completeOnboarding = async (profile: OnboardingProfile) => {
    const targetWorkspace =
      profile.workspaceType === "independent" ? "personal" : "symco";
    const saved = await actions.configureIdentity(
      currentUser.id,
      targetWorkspace,
      profile.name.trim(),
      profile.email.trim(),
      profile.organization.trim(),
      profile.role.trim(),
    );
    if (!saved) return;
    const next = { completed: true, tutorialSeen: false, profile };
    if (!cloud) saveOnboarding(next);
    setOnboarding(next);
    setWorkspaceId(targetWorkspace);
    if (!cloud) localStorage.setItem("symos-workspace", targetWorkspace);
    navigate("/app");
    setTourOpen(true);
  };
  const closeTutorial = () => {
    setTourOpen(false);
    const next = { ...onboarding, tutorialSeen: true };
    setOnboarding(next);
    if (!cloud) saveOnboarding(next);
  };
  const startTutorial = () => {
    navigate("/app");
    setTourOpen(true);
  };
  const isProjectsPage = [
    "/app/projects",
    "/app/portfolio",
    "/app/calendar",
  ].includes(path);
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
            path: "/app/projects",
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
  const pageProps = {
    database,
    projects,
    workspaceId: workspace.id,
    actions,
    navigate,
  };
  const descriptions: Record<string, string> = {
    "/app":
      "Acompanhe o desempenho dos projetos, prioridades e próximos marcos.",
    "/app/projects": "Acompanhe seus projetos, responsáveis e prazos.",
    "/app/documents":
      "Centralize, organize e compartilhe os documentos dos seus projetos.",
    [governancePath]:
      "Acompanhe a qualidade, as aprovações, os riscos e as decisões dos projetos.",
    "/app/automations":
      "Conecte eventos e ações para simplificar o trabalho da equipe.",
    "/app/reports": "Transforme dados dos projetos em informação para decidir.",
    [settingsPath]:
      "Gerencie o workspace, os módulos e suas preferências de interface.",
  };
  const title =
    path === "/app"
      ? "Visão Geral"
      : isProjectsPage
        ? "Projetos"
        : path === "/app/projects/new"
          ? "Criar novo projeto"
          : project
            ? project.name
            : navigation
                .flatMap((group) => group.links)
                .find((link) => link.path === pagePath)?.label ||
              modules.find((m) => path === `/app/modules/${m.id}`)?.name ||
              "Página não encontrada";

  if (path === "/" || path === "/welcome" || !onboarding.completed) {
    return (
      <Onboarding
        initial={onboarding.profile}
        finish={completeOnboarding}
        cloud={cloud}
        errorMessage={actions.error || accountError}
        reload={actions.conflict ? () => location.reload() : undefined}
        enter={onboarding.completed ? () => navigate("/app") : undefined}
        signOut={signOut}
      />
    );
  }

  return (
    <div className={`os-shell ${sidebar ? "" : "os-collapsed"}`}>
      <aside
        id="workspace-navigation"
        className={`os-sidebar ${mobileNav ? "mobile-open" : ""}`}
      >
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
                  data-tour={
                    target === "/app/projects" ? "projects" : undefined
                  }
                  key={target}
                  title={label}
                  aria-label={label}
                  aria-current={
                    pagePath === target ||
                    (target === "/app/projects" &&
                      (isProjectsPage ||
                        !!project ||
                        path === "/app/projects/new"))
                      ? "page"
                      : undefined
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
              <button
                title={module.description}
                key={module.id}
                onClick={() => navigate(`/app/modules/${module.id}`)}
              >
                <span className="module-mark">✦</span>
                <span>{module.name}</span>
              </button>
            ))}
        </div>
        <div className="os-sidebar-bottom">
          <button
            onClick={() => {
              setTourOpen(false);
              navigate("/");
            }}
            aria-label="Abrir página inicial"
          >
            <Compass size={17} />
            <span>Página inicial</span>
          </button>
          {signOut && (
            <button onClick={signOut} aria-label="Sair da conta">
              <LogOut size={17} />
              <span>Sair da conta</span>
            </button>
          )}
          <button
            onClick={() => setSidebar((value) => !value)}
            aria-label={sidebar ? "Recolher menu" : "Expandir menu"}
            aria-expanded={sidebar}
          >
            <ChevronLeft size={17} />
            <span>{sidebar ? "Recolher menu" : "Expandir menu"}</span>
          </button>
        </div>
      </aside>
      <button
        type="button"
        className="os-scrim"
        data-open={mobileNav}
        tabIndex={-1}
        aria-label="Fechar menu"
        onClick={() => setMobileNav(false)}
      />
      <div className="os-workspace">
        <header className="os-topbar">
          <button
            className="os-mobile-menu"
            data-tour="mobile-menu"
            aria-label={mobileNav ? "Fechar menu" : "Abrir menu"}
            aria-controls="workspace-navigation"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((open) => !open)}
          >
            <Menu size={21} />
          </button>
          <label className="os-workspace-select" data-tour="workspace">
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
          <div className="os-search-wrap" data-tour="search">
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
            <div
              className="os-search-popover"
              data-open={searchOpen}
              aria-hidden={!searchOpen}
              ref={(element) => {
                element?.toggleAttribute("inert", !searchOpen);
              }}
            >
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
          </div>
          <Button
            variant="icon"
            className="os-start-button"
            title="Página inicial"
            aria-label="Abrir página inicial"
            onClick={() => {
              setTourOpen(false);
              navigate("/");
            }}
          >
            <Compass size={18} />
          </Button>
          <Button
            className="os-help-button"
            onClick={startTutorial}
            aria-label="Tutorial"
          >
            <CircleHelp size={17} /> <span>Tutorial</span>
          </Button>
          <Button
            variant="icon"
            aria-label="Notificações"
            aria-expanded={notificationsOpen}
            aria-controls="workspace-notifications"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell size={18} />
          </Button>
          <div className="os-user">
            <span className="os-avatar">
              {currentUser.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <span>
              {currentUser.name}
              <small>{currentUser.role || onboarding.profile.role}</small>
            </span>
          </div>
          <div
            id="workspace-notifications"
            className="os-notifications"
            data-open={notificationsOpen}
            aria-hidden={!notificationsOpen}
            ref={(element) => {
              element?.toggleAttribute("inert", !notificationsOpen);
            }}
          >
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
        </header>
        <main className="os-main">
          <div className="os-page-content" key={pagePath}>
            <div className="os-page-header">
              <div>
                <small>SYMOS / {workspace.name.toUpperCase()}</small>
                <h1>{title}</h1>
                {!project && (
                  <p>
                    {descriptions[
                      isProjectsPage ? "/app/projects" : pagePath
                    ] || "Inteligência, governança e execução em um só lugar."}
                  </p>
                )}
              </div>
              {(path === "/app" || isProjectsPage) && (
                <Button
                  data-tour="new-project"
                  variant="primary"
                  onClick={() => navigate("/app/projects/new")}
                >
                  <Plus size={16} /> Novo projeto
                </Button>
              )}
            </div>
            {path === "/app" && (
              <Dashboard
                database={database}
                projects={projects}
                navigate={navigate}
              />
            )}
            {isProjectsPage && (
              <Portfolio
                database={database}
                projects={projects}
                navigate={navigate}
                initialView={
                  path === "/app/calendar"
                    ? "schedule"
                    : path === "/app/portfolio"
                      ? "table"
                      : "cards"
                }
                key={path}
              />
            )}
            {path === "/app/projects/new" && (
              <NewProject
                database={database}
                workspace={workspace}
                create={actions.createProject}
                ownerId={currentUser.id}
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
            {path === "/app/documents" && <Documents {...pageProps} />}
            {path === "/app/automations" && <Automations {...pageProps} />}
            {path === "/app/reports" && <Reports {...pageProps} />}
            {settingsTab && (
              <SettingsPage
                {...pageProps}
                tab={settingsTab}
                safeMode={safeMode}
                personalPreferences={personalPreferences}
              />
            )}
            {path.startsWith("/app/modules/") &&
              modules.some((m) => path === `/app/modules/${m.id}`) && (
                <Portfolio
                  database={database}
                  projects={projects.filter((p) =>
                    p.moduleIds.includes(path.split("/").at(-1)!),
                  )}
                  navigate={navigate}
                />
              )}
            {governanceTab && (
              <Governance section={governanceTab} {...pageProps} />
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
          </div>
        </main>
        {(actions.error || accountError) && (
          <div className="os-error" role="alert">
            {actions.error || accountError}
            {actions.conflict && (
              <button onClick={() => location.reload()}>Recarregar</button>
            )}
            {actions.error && (
              <button onClick={actions.dismissError} aria-label="Fechar">
                <X size={15} />
              </button>
            )}
          </div>
        )}
      </div>
      {tourOpen && (
        <Tutorial
          projectId={projects[0]?.id}
          navigate={navigate}
          close={closeTutorial}
        />
      )}
    </div>
  );
}
