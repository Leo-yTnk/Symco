import { useState } from "react";
import { EditRecordActions } from "../components/os/Dropdown";
import {
  GovernanceRecordEditor,
  type GovernanceRecord,
} from "./GovernanceRecordEditor";
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
        <Records key={section} section={section} {...props} />
      )}
    </>
  );
}

function Records({
  section,
  database,
  projects,
  navigate,
  actions,
}: PageProps & {
  section: "risks" | "decisions";
}) {
  const projectNames = new Map(projects.map(({ id, name }) => [id, name]));
  const [editing, setEditing] = useState<GovernanceRecord | null>(null);
  const entries: GovernanceRecord[] =
    section === "risks"
      ? database.risks
          .filter(({ projectId }) => projectNames.has(projectId))
          .map((record) => ({ kind: "risk", record }))
      : database.decisions
          .filter(({ projectId }) => projectNames.has(projectId))
          .map((record) => ({ kind: "decision", record }));

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
          {entries.map((entry) => {
            const { id, projectId, title } = entry.record;
            const detail =
              entry.kind === "risk"
                ? `${entry.record.status === "open" ? "Aberto" : "Mitigado"} · impacto ${entry.record.impact}`
                : `Decidido por ${userName(database, entry.record.decidedBy)} · ${formatDate(entry.record.decidedAt)}`;
            return (
              <EditRecordActions
                key={id}
                title={title}
                edit={() => setEditing(entry)}
                remove={() => {
                  void (entry.kind === "risk"
                    ? actions.deleteRisk(id)
                    : actions.deleteDecision(id));
                }}
              >
                {(events, trigger) => (
                  <div className="os-record-with-actions" {...events}>
                    <div>
                      <Button
                        variant="link"
                        onClick={() => navigate(`/app/projects/${projectId}`)}
                      >
                        {title}
                      </Button>
                      <small>
                        {projectNames.get(projectId)} · {detail}
                      </small>
                    </div>
                    {trigger}
                  </div>
                )}
              </EditRecordActions>
            );
          })}
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
      {editing && (
        <GovernanceRecordEditor
          entry={editing}
          actions={actions}
          close={() => setEditing(null)}
        />
      )}
    </section>
  );
}
