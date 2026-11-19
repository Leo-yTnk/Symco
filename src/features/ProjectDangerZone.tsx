import { useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { Drawer } from "../components/os/Drawer";
import { Button } from "../components/os/controls";

export function ProjectDangerZone({
  name,
  remove,
}: {
  name: string;
  remove: () => Promise<boolean>;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const matches = confirmation.trim() === name.trim();

  return (
    <section className="os-danger-zone" aria-labelledby={titleId}>
      <div>
        <h3 id={titleId}>Zona de perigo</h3>
        <p>Apague o projeto e seus registros vinculados.</p>
      </div>
      <Button
        variant="danger"
        onClick={() => {
          setConfirmation("");
          setOpen(true);
        }}
      >
        <Trash2 size={16} aria-hidden="true" /> Apagar projeto
      </Button>
      {open && (
        <Drawer title="Apagar projeto" close={() => setOpen(false)}>
          {(dismiss) => (
            <form
              className="os-task-fields"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!matches || pending) return;
                setPending(true);
                if (!(await remove())) setPending(false);
              }}
            >
              <p>
                As tarefas, os documentos e os demais registros deste projeto
                serão apagados. Digite <strong>{name}</strong> para confirmar.
              </p>
              <label>
                Nome do projeto
                <input
                  required
                  value={confirmation}
                  disabled={pending}
                  autoComplete="off"
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
              <div className="os-panel-actions">
                <Button
                  variant="danger"
                  type="submit"
                  disabled={pending || !matches}
                >
                  {pending ? "Apagando…" : "Confirmar exclusão"}
                </Button>
                <Button onClick={dismiss} disabled={pending}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Drawer>
      )}
    </section>
  );
}
