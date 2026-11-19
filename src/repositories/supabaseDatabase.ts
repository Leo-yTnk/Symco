import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";
import { createEmptyDatabase } from "../domain/emptyDatabase";
import type { Database } from "../domain/model";
import {
  DatabaseConflict,
  type DatabaseRepository,
} from "./databaseRepository";

const table = "symos_account_data";

export async function openSupabaseDatabase(
  client: SupabaseClient,
  user: Pick<AuthUser, "id" | "email">,
) {
  const { data: row, error } = await client
    .from(table)
    .select("data,revision")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  let database = row
    ? (row.data as Database)
    : createEmptyDatabase({
        id: user.id,
        name: "",
        email: user.email ?? "",
      });
  if (
    database?.version !== 1 ||
    database.users?.[0]?.id !== user.id ||
    !database.workspaces?.length ||
    !Array.isArray(database.projects)
  ) {
    throw new Error("Dados do SymOS em formato incompatível.");
  }

  let revision: number | undefined = row?.revision;
  const repository: DatabaseRepository = {
    load: () => database,
    async save(next) {
      const nextRevision = (revision ?? 0) + 1;
      const records = client.from(table);
      const request =
        revision === undefined
          ? records.insert({
              user_id: user.id,
              revision: nextRevision,
              data: next,
            })
          : records
              .update({ revision: nextRevision, data: next })
              .eq("user_id", user.id)
              .eq("revision", revision);
      const { data: saved, error: failure } = await request
        .select("revision")
        .maybeSingle();
      if (failure?.code === "23505") throw new DatabaseConflict();
      if (failure) throw failure;
      if (!saved) throw new DatabaseConflict();
      revision = saved.revision;
      database = next;
    },
  };

  return { repository, ready: Boolean(row) };
}
