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
  const { createSeed } = await load("tests/fixtures/seed.ts");
  const { progress, projectTasks } = await load("src/domain/selectors.ts");
  const database = createSeed();
  assert.equal(progress(database, "aky-mayo"), 40);
  database.tasks.find((task) => task.id === "task-3").status = "done";
  assert.equal(progress(database, "aky-mayo"), 60);
  assert.equal(projectTasks(database, "puddings").length, 2);
  assert.equal(progress(database, "no-tasks"), 0);
});

test("local repository removes examples and preserves real projects through a reload", async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  const { localDatabase } = await load("src/repositories/localDatabase.ts");
  const initial = localDatabase.load();
  assert.deepEqual(initial.projects, []);
  assert.deepEqual(initial.clients, []);

  const { createSeed } = await load("tests/fixtures/seed.ts");
  const legacy = createSeed();
  const created = {
    ...legacy.projects[0],
    id: "persisted-project",
    name: "Persisted project",
  };
  legacy.projects.push(created);
  legacy.tasks.push({ ...legacy.tasks[0], id: "real-task", projectId: created.id });
  store.set("symos-database-v1", JSON.stringify(legacy));

  const migrated = localDatabase.load();
  assert.deepEqual(migrated.projects.map(({ id }) => id), [created.id]);
  assert.deepEqual(migrated.tasks.map(({ id }) => id), ["real-task"]);
  assert.equal(migrated.projects[0].ownerId, migrated.users[0].id);
  assert.equal(migrated.projects[0].clientId, undefined);
  assert.equal(migrated.clients.length, 0);
  assert.equal(migrated.attachments.length, 0);
  localDatabase.save(migrated);
  assert.equal(localDatabase.load().projects[0].name, created.name);
  assert.equal(JSON.parse(store.get("symos-database-v1")).projects.length, 5);
  delete globalThis.localStorage;
});
