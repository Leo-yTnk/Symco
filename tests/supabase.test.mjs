import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createClient } from "@supabase/supabase-js";

const output = await build({
  entryPoints: ["src/repositories/supabaseDatabase.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { openSupabaseDatabase } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);
const user = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "test@example.com",
};

test("Supabase saves and restores a workspace and rejects stale revisions", async () => {
  let row;
  const fetch = async (input, init) => {
    const { pathname, searchParams } = new URL(input);
    const reply = (data, status = 200) => Response.json(data, { status });
    assert.equal(pathname, "/rest/v1/symos_account_data");
    if (init.method === "GET") {
      assert.equal(searchParams.get("user_id"), `eq.${user.id}`);
      return reply(row ? [row] : []);
    }
    const data = JSON.parse(init.body);
    if (init.method === "POST") {
      assert.equal(data.user_id, user.id);
      if (row) return reply({ code: "23505", message: "duplicate key" }, 409);
    } else {
      assert.equal(init.method, "PATCH");
      assert.equal(searchParams.get("user_id"), `eq.${user.id}`);
      if (searchParams.get("revision") !== `eq.${row.revision}`)
        return reply([]);
    }
    row = { data: data.data, revision: data.revision };
    return reply([{ revision: row.revision }]);
  };
  const client = createClient(
    "https://example.supabase.co",
    "sb_publishable_test",
    {
      accessToken: async () => "test-user-token",
      global: { fetch },
    },
  );
  const first = await openSupabaseDatabase(client, user);
  const concurrentFirst = await openSupabaseDatabase(client, user);
  assert.equal(first.ready, false);
  const initial = first.repository.load();
  assert.deepEqual(initial.projects, []);
  assert.equal(initial.users[0].id, user.id);
  const next = {
    ...initial,
    workspaces: [{ ...initial.workspaces[0], name: "Workspace real" }],
  };
  await first.repository.save(next);
  await assert.rejects(
    () => concurrentFirst.repository.save(initial),
    (error) => error.constructor.name === "DatabaseConflict",
  );
  const second = await openSupabaseDatabase(client, user);
  assert.equal(second.ready, true);
  assert.deepEqual(second.repository.load(), next);
  await first.repository.save({
    ...next,
    clients: [{ id: "1", name: "Cliente real" }],
  });
  await assert.rejects(
    () => second.repository.save(next),
    (error) => error.constructor.name === "DatabaseConflict",
  );
  assert.equal(row.revision, 2);
  assert.equal(row.data.clients[0].name, "Cliente real");
});
