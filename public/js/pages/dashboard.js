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
                <h3 class="m-0">Word</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Documentos profissionais, formatação e produtividade no dia a dia.</p>
              <button class="btn primary" id="go-word">Começar Word</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">Excel</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Planilhas, fórmulas, tabelas e análise de dados para operação.</p>
              <button class="btn primary" id="go-excel">Começar Excel</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">Logística</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Fluxo de materiais, estoque e distribuição com foco operacional.</p>
              <button class="btn primary" id="go-logistica">Começar Logística</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">Administração</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Organização de rotinas, planejamento e controle administrativo.</p>
              <button class="btn primary" id="go-adm">Começar ADM</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">Finanças</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Conceitos financeiros, fluxo de caixa e decisão com dados.</p>
              <button class="btn primary" id="go-financas">Começar Finanças</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">Compras</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Processo de aquisição, negociação e controle de fornecedores.</p>
              <button class="btn primary" id="go-compras">Começar Compras</button>
            </div>

            <div class="card pad course-card">
              <div class="row row-between">
                <h3 class="m-0">RH</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Processos de pessoas: recrutamento, onboarding e desenvolvimento.</p>
              <button class="btn primary" id="go-rh">Começar RH</button>
            </div>

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
                <h3 class="m-0">Power Point</h3>
                <span class="badge">Trilha</span>
              </div>
              <p class="muted">Apresentações claras e objetivas para treinamentos e reuniões.</p>
              <button class="btn primary" id="go-powerpoint">Começar Power Point</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  bindHeaderEvents(app);

  app.querySelector("#go-html").addEventListener("click", () => navigate("/course/html"));
  app.querySelector("#go-css").addEventListener("click", () => navigate("/course/css"));
  app.querySelector("#go-js").addEventListener("click", () => navigate("/course/js"));
  app.querySelector("#go-word").addEventListener("click", () => navigate("/course/word"));
  app.querySelector("#go-excel").addEventListener("click", () => navigate("/course/excel"));
  app.querySelector("#go-powerpoint").addEventListener("click", () => navigate("/course/powerpoint"));
  app.querySelector("#go-logistica").addEventListener("click", () => navigate("/course/logistica"));
  app.querySelector("#go-compras").addEventListener("click", () => navigate("/course/compras"));
  app.querySelector("#go-adm").addEventListener("click", () => navigate("/course/adm"));
  app.querySelector("#go-financas").addEventListener("click", () => navigate("/course/financas"));
  app.querySelector("#go-rh").addEventListener("click", () => navigate("/course/rh"));
}

