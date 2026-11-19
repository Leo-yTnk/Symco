import { useId, useState } from "react";
import type { WorkspaceActions } from "../application/useWorkspace";
import { Button } from "../components/os/controls";
import { Drawer } from "../components/os/Drawer";
import { Select } from "../components/os/Dropdown";
import type { Decision, Risk } from "../domain/model";

export type GovernanceRecord =
  { kind: "risk"; record: Risk } | { kind: "decision"; record: Decision };

const levels = [
  { value: "low", label: "Baixo" },
  { value: "medium", label: "Médio" },
  { value: "high", label: "Alto" },
] as const;

export function GovernanceRecordEditor({
  entry,
  actions,
  close,
}: {
  entry: GovernanceRecord;
  actions: WorkspaceActions;
  close: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(entry.record.title);
  const [description, setDescription] = useState(entry.record.description);
  const [risk, setRisk] = useState(entry.kind === "risk" ? entry.record : null);
  const [saving, setSaving] = useState(false);

  return (
    <Drawer
      title={entry.kind === "risk" ? "Editar risco" : "Editar decisão"}
      close={close}
    >
      {(dismiss) => (
        <form
          className="os-task-fields"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!title.trim() || saving) return;
            setSaving(true);
            const details = {
              title: title.trim(),
              description: description.trim(),
            };
            const saved = risk
              ? await actions.updateRisk(entry.record.id, {
                  ...details,
                  status: risk.status,
                  impact: risk.impact,
                  probability: risk.probability,
                  mitigation: risk.mitigation?.trim(),
                })
              : await actions.updateDecision(entry.record.id, details);
            if (saved) dismiss();
            else setSaving(false);
          }}
        >
          <label>
            Título
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Descrição
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          {risk && (
            <>
              <label htmlFor={`${id}-status`}>
                Status
                <Select
                  id={`${id}-status`}
                  label="Status"
                  value={risk.status}
                  options={[
                    { value: "open", label: "Aberto" },
                    { value: "mitigated", label: "Mitigado" },
                  ]}
                  onChange={(status) => setRisk({ ...risk, status })}
                />
              </label>
              <label htmlFor={`${id}-impact`}>
                Impacto
                <Select
                  id={`${id}-impact`}
                  label="Impacto"
                  value={risk.impact}
                  options={levels}
                  onChange={(impact) => setRisk({ ...risk, impact })}
                />
              </label>
              <label htmlFor={`${id}-probability`}>
                Probabilidade
                <Select
                  id={`${id}-probability`}
                  label="Probabilidade"
                  value={risk.probability}
                  options={levels}
                  onChange={(probability) => setRisk({ ...risk, probability })}
                />
              </label>
              <label>
                Mitigação
                <textarea
                  value={risk.mitigation || ""}
                  onChange={(event) =>
                    setRisk({ ...risk, mitigation: event.target.value })
                  }
                />
              </label>
            </>
          )}
          <div className="os-panel-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !title.trim()}
            >
              Salvar alterações
            </Button>
            <Button onClick={dismiss}>Cancelar</Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
