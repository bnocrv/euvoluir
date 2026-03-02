// public/js/pages/dashboard.js
import { Header, bindHeaderEvents } from "../components/header.js";
import { requireAuth } from "../auth.js";
import { navigate } from "../router.js";

export function DashboardPage(app) {
  const session = requireAuth();
  if (!session) return navigate("/login");

  app.innerHTML = `
    <div class="page">
      ${Header()}
      <main class="main">
        <div class="container stack">
          <div class="card pad">
            <h2 class="m-0">Dashboard</h2>
            <p class="muted mt-10">
              Escolha um curso e avance passo a passo. Sem pular etapa.
            </p>
          </div>

          <div class="grid-2">
            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">HTML</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Base completa para iniciantes: tags, estrutura, semântica e boas práticas.</p>
              <button class="btn primary" id="go-html">Começar HTML</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">CSS</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Layout responsivo, flex, grid, design system e animações.</p>
              <button class="btn primary" id="go-css">Começar CSS</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">JavaScript</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">DOM, lógica, async, APIs e projetos reais.</p>
              <button class="btn primary" id="go-js">Começar JS</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">Projetos</h3>
                <span class="badge">Em breve</span>
              </div>
              <p class="muted">Projetos guiados no estilo "construa e aprenda".</p>
              <button class="btn" disabled>Em breve</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  bindHeaderEvents(app);

  app.querySelector("#go-html").addEventListener("click", () => {
    navigate("/course/html");
  });

  app.querySelector("#go-css").addEventListener("click", () => {
    navigate("/course/css");
  });

  app.querySelector("#go-js").addEventListener("click", () => {
    navigate("/course/js");
  });
}
