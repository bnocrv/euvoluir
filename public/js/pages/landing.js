// public/js/pages/landing.js
import { Header, bindHeaderEvents } from "../components/header.js";

export function LandingPage(app) {
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
              <a class="card pad landing-option" href="#/dashboard">
                <h3 class="m-0">Trilha guiada</h3>
                <p class="muted mt-10">
                  Aulas longas, bem explicadas, e exercícios no final para fixar.
                </p>
              </a>

              <a class="card pad landing-option" href="#/dashboard">
                <h3 class="m-0">Prática</h3>
                <p class="muted mt-10">
                  Você pratica de verdade: quiz, completar código e desafios progressivos.
                </p>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;

  bindHeaderEvents(app);
}
