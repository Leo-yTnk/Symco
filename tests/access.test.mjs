import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

await build({
  entryPoints: ["src/app/SupabaseWorkspace.tsx"],
  bundle: true,
  jsx: "automatic",
  packages: "external",
  platform: "node",
  format: "esm",
  outfile: ".tmp/access.mjs",
});

const { window } = new JSDOM('<div id="root"></div>', {
  url: "https://example.github.io/Symco/#/app",
});
for (const key of [
  "window",
  "document",
  "navigator",
  "location",
  "history",
  "HTMLElement",
  "Event",
  "MouseEvent",
  "FormData",
  "localStorage",
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === "window" ? window : window[key],
  });
}
window.scrollTo = () => {};
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { SupabaseWorkspace } = await import("../.tmp/access.mjs");

const heading = () => document.querySelector(".os-access h2");

async function click(text) {
  const target = [...document.querySelectorAll("button")].find(
    (element) => element.textContent.trim() === text,
  );
  assert.ok(target);
  await act(async () => target.click());
}

async function fill(name, value) {
  const target = document.querySelector(`input[name="${name}"]`);
  assert.ok(target);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set.call(target, value);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function mountClient(signUp) {
  let onSession;
  const client = {
    auth: {
      onAuthStateChange(callback) {
        onSession = callback;
        callback("INITIAL_SESSION", null);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      signUp(credentials) {
        return signUp(credentials, (session) =>
          onSession("SIGNED_IN", session),
        );
      },
    },
    from(table) {
      assert.equal(table, "symos_account_data");
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  };
  const root = createRoot(document.getElementById("root"));
  return { root, client };
}

test("signup validates passwords and handles disabled signup and email confirmation", async () => {
  const requests = [];
  const { root, client } = mountClient(async (credentials) => {
    requests.push(credentials);
    return requests.length === 1
      ? { error: { code: "signup_disabled" } }
      : { data: { session: null }, error: null };
  });
  await act(async () =>
    root.render(createElement(SupabaseWorkspace, { client })),
  );
  try {
    const intro = document.querySelector(".os-company-intro");
    const access = document.querySelector(".os-access");
    assert.ok(intro && access);
    assert.equal(intro.nextElementSibling, access);
    assert.equal(intro.querySelectorAll("li").length, 6);

    const accessHeading = heading();
    assert.equal(accessHeading?.textContent, "Entrar no SymOS");
    const scrollCalls = [];
    accessHeading.scrollIntoView = (options) => scrollCalls.push(options);
    await click("Acessar o SymOS");
    assert.equal(document.activeElement, accessHeading);
    assert.deepEqual(scrollCalls, [{ block: "start" }]);
    assert.equal(location.hash, "#/app");

    await click("Criar conta");
    await fill("email", "conta@example.com");
    await fill("password", "Senha-teste-42");
    await fill("confirmation", "Senha diferente");
    await click("Criar conta");
    assert.equal(requests.length, 0);
    assert.match(
      document.querySelector('[role="alert"]').textContent,
      /senhas precisam ser iguais/,
    );
    await fill("confirmation", "Senha-teste-42");
    await click("Criar conta");
    assert.match(
      document.querySelector('[role="alert"]').textContent,
      /desativado/,
    );
    await click("Criar conta");
    assert.equal(heading()?.textContent, "Confirme seu e-mail");
    assert.deepEqual(requests[1], {
      email: "conta@example.com",
      password: "Senha-teste-42",
      options: { emailRedirectTo: "https://example.github.io/Symco/" },
    });
    await click("Voltar para o login");
    assert.equal(heading()?.textContent, "Entrar no SymOS");
    assert.equal(
      document.querySelector('input[name="email"]').value,
      "conta@example.com",
    );
    assert.equal(document.querySelector('input[name="password"]').value, "");
  } finally {
    await act(async () => root.unmount());
  }
});

test("signup with a session opens the account workspace onboarding", async () => {
  const session = { user: { id: "new-account", email: "nova@example.com" } };
  const { root, client } = mountClient(async (_, signedIn) => {
    signedIn(session);
    return { data: { session }, error: null };
  });
  await act(async () =>
    root.render(createElement(SupabaseWorkspace, { client })),
  );
  try {
    await click("Criar conta");
    await fill("email", session.user.email);
    await fill("password", "Senha-teste-42");
    await fill("confirmation", "Senha-teste-42");
    await click("Criar conta");
    assert.ok(document.querySelector(".os-onboarding-grid"));
    assert.ok(!document.querySelector(".os-company-intro"));
    assert.ok(!document.querySelector('input[name="password"]'));
  } finally {
    await act(async () => root.unmount());
  }
});
