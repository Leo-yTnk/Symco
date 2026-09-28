import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

const output = ".tmp/app-flow.mjs";
await build({
  entryPoints: ["src/app/App.tsx"],
  bundle: true,
  jsx: "automatic",
  packages: "external",
  platform: "node",
  format: "esm",
  outfile: output,
});

const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: "http://localhost/app" },
);
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
])
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: dom.window[key],
  });
window.scrollTo = () => {};
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: App } = await import(`../${output}`);
const container = document.getElementById("root");
const button = (label) =>
  [...document.querySelectorAll("button")].find((node) =>
    node.textContent.trim().includes(label),
  );
const click = async (node) => {
  assert.ok(node);
  await act(async () =>
    node.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
};
const input = async (node, value) => {
  assert.ok(node);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      node.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype,
      "value",
    ).set.call(node, value);
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
};

test("create a project and a task, then restore both after a new mount", async () => {
  let root = createRoot(container);
  await act(async () => root.render(createElement(App)));
  assert.match(document.body.textContent, /Uma ideia merece mais/);
  await click(button("Configurar meu espaço"));
  await input(
    document.querySelector(
      'input[placeholder="Como você gostaria de ser chamado?"]',
    ),
    "Operador Teste",
  );
  await input(
    document.querySelector('input[placeholder="Ex.: Gerente de projetos"]'),
    "Coordenador",
  );
  await click(button("Continuar"));
  await input(
    document.querySelector(
      'input[placeholder="Empresa, equipe ou projeto pessoal"]',
    ),
    "Workspace Teste",
  );
  await click(button("Entrar no SymOS"));
  assert.match(document.body.textContent, /Comece pela visão geral/);
  await click(button("Pular tutorial"));
  assert.match(document.body.textContent, /Workspace Teste/);
  await click(button("Novo projeto"));
  assert.match(document.body.textContent, /Criar novo projeto/);
  await input(
    document.querySelector('input[placeholder="Ex.: Nova linha de produtos"]'),
    "Projeto de teste",
  );
  await input(
    [...document.querySelectorAll('input[type="date"]')].at(-1),
    new Date(Date.now() + 100 * 86400000).toISOString().slice(0, 10),
  );
  await click(button("Criar projeto"));
  assert.match(document.body.textContent, /Projeto de teste/);
  await click(button("Nova tarefa"));
  await input(
    document.querySelector('input[placeholder="O que precisa ser feito?"]'),
    "Verificar embalagem",
  );
  await click(button("Criar"));
  assert.match(document.body.textContent, /Verificar embalagem/);
  await click(button("Kanban"));
  const card = [...document.querySelectorAll(".os-kanban-task")].find((node) =>
    node.textContent.includes("Verificar embalagem"),
  );
  const doneColumn = [...document.querySelectorAll(".os-kanban-column")].find(
    (node) => node.querySelector("h3")?.textContent.includes("Concluída"),
  );
  assert.ok(card && doneColumn);
  const transfer = new Map();
  const drag = new Event("dragstart", { bubbles: true });
  drag.dataTransfer = {
    setData: (type, value) => transfer.set(type, value),
  };
  const drop = new Event("drop", { bubbles: true, cancelable: true });
  drop.dataTransfer = { getData: (type) => transfer.get(type) };
  await act(async () => {
    card.dispatchEvent(drag);
    doneColumn.dispatchEvent(drop);
  });
  assert.match(doneColumn.textContent, /Verificar embalagem/);
  await input(
    document.querySelector(".os-detail-rail textarea"),
    "Primeira versão revisada",
  );
  await click(button("Comentar"));
  assert.match(document.body.textContent, /Primeira versão revisada/);
  await act(async () => root.unmount());
  root = createRoot(container);
  await act(async () => root.render(createElement(App)));
  assert.match(document.body.textContent, /Projeto de teste/);
  assert.match(document.body.textContent, /Verificar embalagem/);
  assert.match(document.body.textContent, /Primeira versão revisada/);
  assert.match(
    document.querySelector(".os-project-summary")?.textContent,
    /25%/,
  );
  await click(button("Tutorial"));
  assert.match(document.body.textContent, /Comece pela visão geral/);
  for (let step = 0; step < 4; step++) await click(button("Próximo"));
  assert.match(document.body.textContent, /Execute e preserve decisões/);
  assert.ok(document.querySelector('[data-tour="project-tabs"]'));
  await click(button("Concluir"));
  assert.equal(document.querySelector(".os-tour-card"), null);
  await act(async () => root.unmount());
});

test("exploration can skip personal details and still keep the introduction available", async () => {
  localStorage.clear();
  history.replaceState({}, "", "/app");
  let root = createRoot(container);
  await act(async () => root.render(createElement(App)));
  await click(button("Explorar a demonstração"));
  assert.match(document.body.textContent, /Comece pela visão geral/);
  await click(button("Pular tutorial"));
  assert.match(document.body.textContent, /Maionese Popular/);
  await click(
    document.querySelector('button[aria-label="Abrir página inicial"]'),
  );
  assert.match(document.body.textContent, /Uma ideia merece mais/);
  await act(async () => root.unmount());
  root = createRoot(container);
  await act(async () => root.render(createElement(App)));
  assert.match(document.body.textContent, /Uma ideia merece mais/);
  await click(button("Explorar a demonstração"));
  await click(button("Pular tutorial"));
  assert.match(document.body.textContent, /Visão Geral/);
  await act(async () => root.unmount());
});

test("task details keep actions separate, guard unsaved edits, and persist a saved change", async () => {
  localStorage.clear();
  localStorage.setItem(
    "symos-onboarding-v1",
    JSON.stringify({ completed: true, tutorialSeen: true, profile: {} }),
  );
  history.replaceState({}, "", "/app/projects/aky-mayo");
  let root = createRoot(container);
  await act(async () => root.render(createElement(App)));
  const row = [...document.querySelectorAll(".os-table tbody tr")].find(
    (item) => item.textContent.includes("Formulação piloto"),
  );
  assert.equal(row.tabIndex, 0);
  await act(async () => {
    row.focus();
    row.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });
  const panel = document.querySelector(".os-task-panel");
  assert.ok(panel?.querySelector(".os-task-panel-scroll"));
  assert.ok(panel?.querySelector(".os-task-panel-footer"));
  assert.equal(
    panel
      .querySelector(".os-task-panel-scroll")
      .contains(panel.querySelector(".os-task-panel-footer")),
    false,
  );
  await input(
    panel.querySelector(".os-task-fields input"),
    "Formulação revisada",
  );
  await click(button("Cancelar"));
  assert.match(panel.textContent, /Descartar alterações/);
  await click(button("Continuar editando"));
  assert.equal(panel.querySelector(".os-discard-confirm"), null);
  await click(button("Salvar"));
  await act(async () => new Promise((resolve) => setTimeout(resolve, 210)));
  assert.equal(document.querySelector(".os-task-panel"), null);
  assert.match(document.body.textContent, /Formulação revisada/);
  await act(async () => root.unmount());
  root = createRoot(container);
  await act(async () => root.render(createElement(App)));
  assert.match(document.body.textContent, /Formulação revisada/);
  await act(async () => root.unmount());
});
