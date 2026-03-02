// public/js/pages/landing.js
import { Header, bindHeaderEvents } from "../components/header.js";

export function LandingPage(app) {
  const targetRoute = "#/dashboard";
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

            <div class="grid-2 mt-14">
              ${highlights
                .map(
                  (item) => `
                <a class="card pad landing-option" href="${targetRoute}">
                  <h3 class="m-0">${item.title}</h3>
                  <p class="muted mt-10">${item.description}</p>
                </a>
              `
                )
                .join("")}
            </div>
          </section>
        </div>
      </main>
    </div>
  `;

  bindHeaderEvents(app);
}
