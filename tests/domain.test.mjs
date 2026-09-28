import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

async function load(entry) {
  const output = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
  );
}

test("progress reflects completed tasks and stays scoped to a project", async () => {
  const { createSeed } = await load("src/domain/seed.ts");
  const { progress, projectTasks } = await load("src/domain/selectors.ts");
  const database = createSeed();
  assert.equal(progress(database, "aky-mayo"), 40);
  database.tasks.find((task) => task.id === "task-3").status = "done";
  assert.equal(progress(database, "aky-mayo"), 60);
  assert.equal(projectTasks(database, "puddings").length, 2);
  assert.equal(progress(database, "no-tasks"), 0);
});

test("repository seeds once and persists a changed project through a reload", async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  const { localDatabase } = await load("src/repositories/localDatabase.ts");
  const initial = localDatabase.load();
  const created = {
    ...initial.projects[0],
    id: "persisted-project",
    name: "Persisted project",
  };
  localDatabase.save({ ...initial, projects: [...initial.projects, created] });
  assert.equal(localDatabase.load().projects.at(-1).name, "Persisted project");
  assert.equal(store.size, 1);
  delete globalThis.localStorage;
});
