import { Button, SegmentedControl } from "../components/os/controls";
import { formatDate, userName } from "../domain/selectors";
import { Approvals } from "./Approvals";
import { Quality } from "./Quality";
import type { PageProps } from "./workspaceUi";

export const governancePath = "/app/governance";
const sections = {
  quality: "Qualidade",
  approvals: "Aprovações",
  risks: "Riscos",
  decisions: "Decisões",
};
type Section = keyof typeof sections;

export function governanceSection(path: string): Section | undefined {
  if (path === governancePath) return "quality";
  return (Object.keys(sections) as Section[]).find(
    (section) =>
      path === `${governancePath}/${section}` || path === `/app/${section}`,
  );
}

export function Governance({
  section,
  ...props
}: PageProps & { section: Section }) {
  const { database, projects, navigate } = props;
  const projectIds = new Set(projects.map(({ id }) => id));
  const pending = database.approvals.filter(
    ({ projectId, status }) =>
      projectIds.has(projectId) && status === "pending",
  ).length;

  return (
    <>
      <SegmentedControl
        label="Seções de governança"
        wide
        wrap
        options={{
          ...sections,
          approvals: pending ? `Aprovações (${pending})` : sections.approvals,
        }}
        value={section}
        onChange={(next) => {
          if (next !== section) navigate(`${governancePath}/${next}`);
        }}
      />
      {section === "quality" && <Quality {...props} />}
      {section === "approvals" && <Approvals {...props} />}
      {(section === "risks" || section === "decisions") && (
        <Records section={section} {...props} />
      )}
    </>
  );
}

function Records({
  section,
  database,
  projects,
  navigate,
}: PageProps & {
  section: "risks" | "decisions";
}) {
  const projectNames = new Map(projects.map(({ id, name }) => [id, name]));
  const entries =
    section === "risks"
      ? database.risks
          .filter(({ projectId }) => projectNames.has(projectId))
          .map(({ id, projectId, title, status, impact }) => ({
            id,
            projectId,
            title,
            detail: `${status === "open" ? "Aberto" : "Mitigado"} · impacto ${impact}`,
          }))
      : database.decisions
          .filter(({ projectId }) => projectNames.has(projectId))
          .map(({ id, projectId, title, decidedBy, decidedAt }) => ({
            id,
            projectId,
            title,
            detail: `Decidido por ${userName(database, decidedBy)} · ${formatDate(decidedAt)}`,
          }));

  return (
    <section className="os-section">
      <div className="os-section-head">
        <div>
          <h2>{sections[section]}</h2>
          <p>Registros dos projetos do workspace atual.</p>
        </div>
      </div>
      {entries.length ? (
        <div className="os-records">
          {entries.map(({ id, projectId, title, detail }) => (
            <button
              key={id}
              onClick={() => navigate(`/app/projects/${projectId}`)}
            >
              <strong>{title}</strong>
              <small>
                {projectNames.get(projectId)} · {detail}
              </small>
            </button>
          ))}
        </div>
      ) : (
        <div className="os-empty">
          <h3>Nenhum registro ainda</h3>
          <p>Abra um projeto para adicionar ou acompanhar itens.</p>
          <Button variant="primary" onClick={() => navigate("/app/projects")}>
            Ver projetos
          </Button>
        </div>
      )}
    </section>
  );
}
