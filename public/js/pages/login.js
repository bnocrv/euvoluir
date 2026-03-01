// public/js/pages/login.js
import { Header, bindHeaderEvents } from "../components/header.js";
import { login, getSession } from "../auth.js";
import { navigate } from "../router.js";

export function LoginPage(app) {
  const session = getSession();
  if (session) navigate("/dashboard");

  app.innerHTML = `
    <div class="page">
      ${Header()}
      <main class="main">
        <div class="container">
          <div class="card pad auth-card mx-auto">
            <h2 class="m-0">Entrar</h2>
            <p class="muted mt-10">
              Use um usuário do <code>data/users.json</code>.
            </p>

            <form id="login-form" class="stack mt-16">
              <div class="stack gap-8">
                <label class="muted">Usuário</label>
                <input class="input" name="username" autocomplete="username" required />
              </div>

              <div class="stack gap-8">
                <label class="muted">Senha</label>
                <input class="input" type="password" name="password" autocomplete="current-password" required />
              </div>

              <button class="btn primary" type="submit">Entrar</button>
              <div id="error" class="muted"></div>
            </form>
          </div>
        </div>
      </main>
    </div>
  `;

  bindHeaderEvents(app);

  const form = app.querySelector("#login-form");
  const errorEl = app.querySelector("#error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const data = new FormData(form);
    const username = data.get("username");
    const password = data.get("password");

    const result = await login(username, password);
    if (!result.ok) {
      errorEl.textContent = result.message;
      return;
    }
    navigate("/dashboard");
  });
}
