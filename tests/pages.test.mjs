import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
await build({
  entryPoints: ["src/app/App.tsx"],
  bundle: true,
  jsx: "automatic",
  packages: "external",
  platform: "node",
  format: "esm",
  outfile: ".tmp/pages.mjs",
});
const dom = new JSDOM('<div id="root"></div>', {
  url: "http://localhost/Symco/#/app",
});
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Element",
  "MouseEvent",
  "Event",
  "localStorage",
  "history",
  "location",
  "FormData",
  "File",
  "FileReader",
])
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: dom.window[key],
  });
window.scrollTo = () => {};
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
localStorage.setItem(
  "symos-onboarding-v1",
  JSON.stringify({ completed: true, tutorialSeen: true, profile: {} }),
);
const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../.tmp/pages.mjs");
await build({
  entryPoints: ["src/application/useWorkspace.ts"],
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  outfile: ".tmp/actions.mjs",
});
const { useWorkspace } = await import("../.tmp/actions.mjs");
const root = createRoot(document.getElementById("root"));
async function mount() {
  await act(async () => root.render(createElement(App)));
  if (document.body.textContent.includes("Explorar demonstração"))
    await click(button("Explorar demonstração"));
  if (button("Pular tutorial")) await click(button("Pular tutorial"));
}
const button = (label) =>
  [...document.querySelectorAll("button")].find(
    (n) => n.textContent.trim() === label,
  );
async function click(node) {
  assert.ok(node);
  await act(async () =>
    node.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
}
async function input(node, value) {
  assert.ok(node);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set.call(node, value);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function route(path) {
  await act(async () => {
    history.pushState({}, "", `#${path}`);
    window.dispatchEvent(new Event("popstate"));
  });
}
const db = () => JSON.parse(localStorage.getItem("symos-database-v1"));
test("all prototype workspace pages render and documents can be created, filtered and edited", async () => {
  await mount();
  for (const [path, title] of [
    ["/app/documents", "Documentos"],
    ["/app/calendar", "Cronograma"],
    ["/app/quality", "Qualidade"],
    ["/app/approvals", "Aprovações"],
    ["/app/automations", "Automações"],
    ["/app/reports", "Relatórios"],
    ["/app/settings", "Configurações"],
  ]) {
    await route(path);
    assert.match(document.querySelector("h1").textContent, new RegExp(title));
    assert.ok(document.querySelector(".os-section"));
  }
  await route("/app/portfolio");
  assert.ok(document.querySelector(".os-table"));
  await route("/app/projects");
  assert.ok(document.querySelector(".os-card-grid"));
  await route("/app/documents");
  const before = db().attachments.length;
  await click(button("Novo documento"));
  await input(
    document.querySelector('input[name="title"]'),
    "Documento de teste",
  );
  await act(async () =>
    document
      .querySelector('[role="dialog"] form')
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.equal(db().attachments.length, before + 1);
  assert.equal(document.querySelector('[role="dialog"]'), null);
  await input(
    document.querySelector('input[aria-label="Buscar documentos"]'),
    "Documento de teste",
  );
  assert.equal(document.querySelectorAll(".os-sheet-table tbody tr").length, 1);
  await click(
    [...document.querySelectorAll(".os-document-name")].find((n) =>
      n.textContent.includes("Documento de teste"),
    ),
  );
  await input(
    document.querySelector('input[name="title"]'),
    "Documento revisado",
  );
  await act(async () =>
    document
      .querySelector('[role="dialog"] form')
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.ok(
    db().attachments.some(
      (d) => d.title === "Documento revisado" && d.updatedAt,
    ),
  );
  await route("/app/settings");
  await input(
    document.querySelector('input[name="name"]'),
    "Workspace atualizado",
  );
  await act(async () =>
    document
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.equal(
    db().workspaces.find((w) => w.id === "symco").name,
    "Workspace atualizado",
  );
});
test("new quality records, approval requests and automation rules persist through the forms", async () => {
  await route("/app/quality");
  await click(button("Novo registro"));
  await input(document.querySelector('input[name="title"]'), "Auditoria teste");
  await input(document.querySelector('input[name="date"]'), "2026-12-01");
  await act(async () =>
    document
      .querySelector('[role="dialog"] form')
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.ok(db().qualityRecords.some((r) => r.title === "Auditoria teste"));
  await route("/app/approvals");
  await click(button("Nova solicitação"));
  await input(document.querySelector('input[name="title"]'), "Aprovação teste");
  await act(async () =>
    document
      .querySelector('[role="dialog"] form')
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.ok(db().approvals.some((a) => a.title === "Aprovação teste"));
  await route("/app/automations");
  await click(button("Nova automação"));
  await input(document.querySelector('input[name="name"]'), "Regra teste");
  await act(async () =>
    document
      .querySelector('[role="dialog"] form')
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.ok(
    db().automations.some((a) => a.name === "Regra teste" && a.enabled),
  );
});
test("uploads store actual bytes and invalid external URLs are rejected", async () => {
  await route("/app/documents");
  await click(button("Upload"));
  await input(document.querySelector('input[name="title"]'), "local-test.txt");
  const NativeFormData = globalThis.FormData;
  const file = new File(["Arquivo local de teste"], "local-test.txt", {
    type: "text/plain",
  });
  globalThis.FormData = class extends NativeFormData {
    constructor(form) {
      super(form);
      this.set("file", file);
    }
  };
  try {
    await act(async () => {
      document
        .querySelector('[role="dialog"] form')
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      const deadline = Date.now() + 1000;
      while (
        !db().attachments.some((d) => d.title === "local-test.txt") &&
        Date.now() < deadline
      )
        await new Promise((resolve) => setTimeout(resolve, 10));
    });
  } finally {
    globalThis.FormData = NativeFormData;
  }
  const saved = db().attachments.find((d) => d.title === "local-test.txt");
  assert.ok(saved);
  assert.equal(saved.size, file.size);
  assert.equal(
    Buffer.from(saved.fileData.split(",")[1], "base64").toString(),
    "Arquivo local de teste",
  );
  await click(button("Novo documento"));
  await input(document.querySelector('input[name="title"]'), "Invalid link");
  await input(
    document.querySelector('input[name="url"]'),
    "javascript:alert(1)",
  );
  const count = db().attachments.length;
  await act(async () =>
    document
      .querySelector('[role="dialog"] form')
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.equal(db().attachments.length, count);
  assert.match(
    document.querySelector('[role="dialog"]').textContent,
    /link http ou https/,
  );
  await click(document.querySelector('[aria-label="Fechar painel"]'));
});

test("empty workspace settings stay scoped to the selected workspace", async () => {
  const select = document.querySelector('select[aria-label="Workspace"]');
  await act(async () => {
    select.value = "personal";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await route("/app/settings");
  const name = document.querySelector('input[name="name"]');
  await input(name, "Meu espaço");
  await act(async () =>
    document
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.equal(
    db().workspaces.find((w) => w.id === "personal").name,
    "Meu espaço",
  );
  assert.equal(
    db().workspaces.find((w) => w.id === "symco").name,
    "Workspace atualizado",
  );
  await route("/app/documents");
  assert.equal(document.querySelectorAll(".os-sheet-table tbody tr").length, 0);
});
test("failed persistence does not publish uploaded metadata or generated automation actions", async () => {
  await act(async () => root.unmount());
  let actions;
  const initial = db();
  const repository = {
    load: () => initial,
    save: () => {
      throw Error("quota");
    },
  };
  function Harness() {
    actions = useWorkspace(repository);
    return null;
  }
  const isolated = createRoot(document.getElementById("root"));
  await act(async () => isolated.render(createElement(Harness)));
  let ok;
  await act(async () => {
    ok = actions.addDocument("aky-mayo", "Arquivo teste", undefined, {
      fileData: "data:text/plain;base64,dGVzdA==",
    });
  });
  assert.equal(ok, false);
  assert.equal(actions.database.attachments.length, initial.attachments.length);
  assert.match(actions.error, /Não foi possível salvar/);
  await act(async () => isolated.unmount());
});
