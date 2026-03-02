// public/js/pages/landing.js
import { Header, bindHeaderEvents } from "../components/header.js";
import { navigate } from "../router.js";

export function LandingPage(app) {
  const highlights = [
   {
  title: "Aprenda sem atalhos",
  description:
    "Conteúdo detalhado para você entender fundamentos e raciocínio, não só decorar. Pratique com quizzes, completar trechos e desafios graduais a cada etapa. No fim, certificado de conclusão e grupo no WhatsApp para suporte e comunidade.",
}
  ];

  app.innerHTML = `
    <div class="page">
      ${Header()}
      <main class="main">
        <div class="container">
          <section class="hero">
            <h1>Aprenda HTML, CSS e JavaScript do básico ao avançado.</h1>
            <p class="muted">
              Uma plataforma simples, bonita e direta ao ponto, feita para estudar de verdade.
            </p>

            <h2 class="landing-about-title mt-16">Sobre o curso</h2>

            <div class="grid-2 mt-14 landing-grid">
              ${highlights
                .map(
                  (item) => `
                <div class="card pad landing-option">
                  <h3 class="m-0">${item.title}</h3>
                  <p class="muted mt-10">${item.description}</p>
                </div>
              `
                )
                .join("")}
            </div>

            <div class="row mt-16">
              <button class="btn primary mx-auto" id="landing-enter">Entrar</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;

  bindHeaderEvents(app);
  app.querySelector("#landing-enter").addEventListener("click", () => navigate("/login"));
}
