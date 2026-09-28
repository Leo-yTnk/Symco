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
  await act(async () => root.unmount());
});
