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
await build({
  entryPoints: ["tests/fixtures/seed.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".tmp/pages-seed.mjs",
});
const { createSeed } = await import("../.tmp/pages-seed.mjs");
const dom = new JSDOM('<div id="root"></div>', {
  url: "http://localhost/Symco/#/app",
});
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Element",
  "Node",
  "KeyboardEvent",
  "getComputedStyle",
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
localStorage.setItem("symos-database-v2", JSON.stringify(createSeed()));
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
const db = () => JSON.parse(localStorage.getItem("symos-database-v2"));
test("all prototype workspace pages render and documents can be created, filtered and edited", async () => {
  await mount();
  for (const [path, title] of [
    ["/app/documents", "Documentos"],
    ["/app/calendar", "Projetos"],
    ["/app/governance", "Governança"],
    ["/app/automations", "Automações"],
    ["/app/reports", "Relatórios"],
    ["/app/settings", "Configurações"],
  ]) {
    await route(path);
    assert.match(document.querySelector("h1").textContent, new RegExp(title));
    assert.ok(document.querySelector(".os-section"));
  }
  await route("/app/calendar");
  assert.ok(button("Gantt"));
  await route("/app/portfolio");
  assert.ok(document.querySelector(".os-table"));
  await route("/app/projects");
  assert.ok(document.querySelector(".os-card-grid"));
  await click(button("Tabela"));
  assert.ok(document.querySelector(".os-table"));
  await click(button("Cronograma"));
  assert.ok(button("Gantt"));
  assert.equal(document.querySelector("h1").textContent, "Projetos");
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
test("workspace governance keeps its navigation across tabs and accepts legacy links", async () => {
  await route("/app/governance");
  const tabs = document.querySelector('[aria-label="Seções de governança"]');
  const quality = () => button("Qualidade");
  assert.equal(quality().getAttribute("aria-pressed"), "true");
  const approvals = [...tabs.querySelectorAll("button")].find((tab) =>
    tab.textContent.startsWith("Aprovações"),
  );
  assert.match(approvals.textContent, /Aprovações \(\d+\)/);
  await click(approvals);
  assert.equal(location.hash, "#/app/governance/approvals");
  assert.equal(
    document.querySelector('[aria-label="Seções de governança"]'),
    tabs,
  );
  assert.ok(button("Nova solicitação"));
  assert.equal(
    document.querySelector('nav [aria-current="page"]').textContent,
    "Governança",
  );
  for (const [path, label] of [
    ["/app/risks", "Riscos"],
    ["/app/decisions", "Decisões"],
    ["/app/quality", "Qualidade"],
    ["/app/approvals", approvals.textContent],
  ]) {
    await route(path);
    assert.equal(document.querySelector("h1").textContent, "Governança");
    assert.equal(
      tabs.querySelector('[aria-pressed="true"]').textContent,
      label,
    );
  }
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

test("context menus edit, delete and restore persisted workspace records", async () => {
  await route("/app/documents");
  const uploaded = db().attachments.find(
    (item) => item.title === "local-test.txt",
  );
  const documentRow = () =>
    [...document.querySelectorAll(".os-sheet-table tbody tr")].find((row) =>
      row.textContent.includes(uploaded.title),
    );
  await act(async () =>
    documentRow().dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 300,
        clientY: 200,
      }),
    ),
  );
  assert.equal(document.activeElement.getAttribute("role"), "menu");
  await click(button("Apagar"));
  assert.equal(documentRow(), undefined);
  assert.equal(
    db().attachments.some((item) => item.id === uploaded.id),
    false,
  );
  await click(button("Desfazer"));
  assert.deepEqual(
    db().attachments.find((item) => item.id === uploaded.id),
    uploaded,
  );
  assert.ok(documentRow());

  await route("/app/governance/risks");
  const risk = db().risks[0];
  const trigger = document.querySelector(
    `[aria-label="Ações de ${risk.title}"]`,
  );
  trigger.focus();
  await act(async () =>
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "F10",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await click(button("Editar"));
  assert.equal(
    document.querySelector('[role="dialog"] h2').textContent,
    "Editar risco",
  );
  const select = document.querySelector(
    '[aria-haspopup="listbox"][aria-label="Status"]',
  );
  await click(select);
  assert.equal(document.activeElement.getAttribute("role"), "listbox");
  assert.equal(
    document.querySelector('[role="option"][aria-selected="true"]').textContent,
    "Aberto",
  );
  for (const key of ["End", "Enter"]) {
    await act(async () =>
      document.activeElement.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      ),
    );
  }
  assert.equal(select.textContent, "Mitigado");
  assert.equal(document.activeElement, select);
  await click(button("Salvar alterações"));
  assert.equal(
    db().risks.find((item) => item.id === risk.id).status,
    "mitigated",
  );
  await click(button("Desfazer"));
  assert.deepEqual(
    db().risks.find((item) => item.id === risk.id),
    risk,
  );
});

test("dropdown clips temporarily through opening and closing animations", async () => {
  await route("/app/documents");
  const trigger = document.querySelector(
    '[aria-label="Projeto"][aria-haspopup="listbox"]',
  );
  const style = document.createElement("style");
  style.textContent =
    ".os-dropdown { --duration-normal: 240ms; } .os-dropdown-list { padding: 4px; }";
  document.head.append(style);
  const animations = [];
  const prototype = window.HTMLElement.prototype;
  const originalBounds = prototype.getBoundingClientRect;
  const scrollHeight = Object.getOwnPropertyDescriptor(
    window.Element.prototype,
    "scrollHeight",
  );
  prototype.getBoundingClientRect = function () {
    const box = originalBounds.call(this);
    if (this.classList.contains("os-dropdown-option"))
      return { ...box, height: 40 };
    if (this.classList.contains("os-dropdown"))
      return { ...box, height: Number.parseFloat(this.style.height) };
    return box;
  };
  Object.defineProperty(window.Element.prototype, "scrollHeight", {
    ...scrollHeight,
    get() {
      return this.classList.contains("os-dropdown-list")
        ? 128
        : scrollHeight.get.call(this);
    },
  });
  prototype.animate = function (frames) {
    let finish;
    const finished = new Promise((resolve) => {
      finish = resolve;
    });
    animations.push({ frames, finish });
    return { finished, cancel() {} };
  };
  try {
    await click(trigger);
    const popup = document.querySelector(".os-dropdown");
    assert.equal(popup.hasAttribute("data-animating"), true);
    assert.deepEqual(animations[0].frames, [
      { height: "48px" },
      { height: "128px" },
    ]);
    await act(async () => animations[0].finish());
    assert.equal(popup.hasAttribute("data-animating"), false);
    await act(async () =>
      document.activeElement.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    assert.equal(popup.hasAttribute("data-animating"), true);
    assert.deepEqual(animations[1].frames, [
      { height: "128px" },
      { height: "48px" },
    ]);
    await act(async () => animations[1].finish());
    assert.equal(document.querySelector(".os-dropdown"), null);
  } finally {
    style.remove();
    delete prototype.animate;
    prototype.getBoundingClientRect = originalBounds;
    Object.defineProperty(
      window.Element.prototype,
      "scrollHeight",
      scrollHeight,
    );
  }
});

test("project deletion requires confirmation and undo restores connected records", async () => {
  const before = db();
  const project = before.projects.find(({ id }) => id === "aky-mayo");
  await route(`/app/projects/${project.id}`);
  const tabs = document.querySelector('[aria-label="Seções do projeto"]');
  const settings = [...tabs.querySelectorAll("button")].find(
    (tab) => tab.textContent === "Configurações",
  );
  await click(settings);
  await click(button("Apagar projeto"));
  const dialog = document.querySelector('[role="dialog"]');
  const confirmation = dialog.querySelector("input");
  const submit = dialog.querySelector("button[type=submit]");
  assert.equal(submit.disabled, true);
  await input(confirmation, "Outro projeto");
  assert.equal(submit.disabled, true);
  await input(confirmation, project.name);
  assert.equal(submit.disabled, false);
  await click(submit);
  assert.equal(location.hash, "#/app/projects");
  const remaining = db();
  assert.ok(remaining.projects.length);
  assert.equal(
    remaining.projects.some(({ id }) => id === project.id),
    false,
  );
  for (const key of [
    "tasks",
    "gates",
    "attachments",
    "comments",
    "decisions",
    "approvals",
    "activities",
    "qualityRecords",
    "automations",
  ]) {
    assert.equal(
      (remaining[key] || []).some(({ projectId }) => projectId === project.id),
      false,
      key,
    );
  }
  assert.deepEqual(remaining.clients, before.clients);
  assert.deepEqual(remaining.workspaces, before.workspaces);
  await click(button("Desfazer"));
  assert.deepEqual(db(), before);
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
test("personal preferences stay active across routes and can be restored", async () => {
  await route("/app/settings");
  await click(button("Preferências"));
  assert.equal(location.hash, "#/app/settings/preferences");
  assert.equal(
    document.querySelector('nav [aria-current="page"]').textContent,
    "Configurações",
  );
  const theme = [
    ...document.querySelectorAll(".os-preference-row select"),
  ].find((select) => select.labels[0].textContent === "Tema");
  await act(async () => {
    theme.value = "dark";
    theme.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await click(
    document.querySelector('[role="switch"][aria-label="Reduzir movimento"]'),
  );
  const { dataset } = document.documentElement;
  assert.equal(dataset.theme, "dark");
  assert.equal(dataset.reduceMotion, "true");

  await route("/app");
  assert.equal(dataset.theme, "dark");
  const saved = JSON.parse(localStorage.getItem("symos-preferences-v1"));
  assert.equal(saved.theme, "dark");
  assert.equal(saved.reduceMotion, true);

  await route("/app/settings/preferences/safe");
  assert.match(
    document.querySelector(".os-preference-notice").textContent,
    /Modo de recuperação ativo/,
  );
  await click(button("Restaurar tema e acessibilidade"));
  assert.equal(dataset.theme, "system");
  assert.equal(dataset.reduceMotion, "false");
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
    ok = await actions.addDocument("aky-mayo", "Arquivo teste", undefined, {
      fileData: "data:text/plain;base64,dGVzdA==",
    });
  });
  assert.equal(ok, false);
  assert.equal(actions.database.attachments.length, initial.attachments.length);
  assert.match(actions.error, /Não foi possível salvar/);
  await act(async () => isolated.unmount());
});

test("task deletion and its undo save atomically with related records", async () => {
  const initial = createSeed();
  const [task, dependent] = initial.tasks;
  dependent.dependencyIds = [...dependent.dependencyIds, task.id];
  initial.subtasks.push({
    id: "undo-subtask",
    taskId: task.id,
    title: "Subtarefa",
    done: false,
  });
  initial.comments.push({
    id: "undo-comment",
    taskId: task.id,
    projectId: task.projectId,
    authorId: initial.users[0].id,
    body: "Comentário",
    createdAt: task.createdAt,
  });

  let actions;
  let persisted = initial;
  let finishSave;
  const repository = {
    load: () => initial,
    save: async (next) => {
      await new Promise((resolve, reject) => {
        finishSave = { resolve, reject };
      });
      persisted = next;
    },
  };
  function Harness() {
    actions = useWorkspace(repository);
    return null;
  }
  const isolated = createRoot(document.getElementById("root"));
  await act(async () => isolated.render(createElement(Harness)));
  let removal;
  await act(async () => {
    removal = actions.deleteTask(task.id);
  });
  assert.equal(actions.operation.pending, true);
  assert.equal(actions.database, initial);
  await act(async () => {
    finishSave.resolve();
    assert.equal(await removal, true);
  });
  assert.equal(actions.operation.canUndo, true);
  assert.equal(
    persisted.tasks.some((item) => item.id === task.id),
    false,
  );
  assert.equal(
    persisted.tasks
      .find((item) => item.id === dependent.id)
      .dependencyIds.includes(task.id),
    false,
  );
  assert.equal(
    persisted.subtasks.some((item) => item.taskId === task.id),
    false,
  );
  assert.equal(
    persisted.comments.some((item) => item.taskId === task.id),
    false,
  );

  let restore;
  await act(async () => {
    restore = actions.undoOperation();
  });
  assert.equal(actions.operation.pending, true);
  await act(async () => {
    finishSave.reject(Error("offline"));
    assert.equal(await restore, false);
  });
  assert.equal(actions.operation.canUndo, true);
  assert.equal(actions.database, persisted);

  await act(async () => {
    restore = actions.undoOperation();
  });
  await act(async () => {
    finishSave.resolve();
    assert.equal(await restore, true);
  });
  assert.deepEqual(persisted, initial);
  assert.equal(actions.operation.canUndo, false);
  await act(async () => isolated.unmount());
});
