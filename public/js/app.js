import { createRouter, navigate } from "./router.js";
import { LandingPage } from "./pages/landing.js";
import { LoginPage } from "./pages/login.js";
import { DashboardPage } from "./pages/dashboard.js";
import { LessonPage } from "./pages/lesson.js";

const app = document.querySelector("#app");

const routes = {
  "/": () => LandingPage(app),
  "/login": () => LoginPage(app),
  "/dashboard": () => DashboardPage(app),
  "/course/:courseId": () => LessonPage(app),
  "/course/:courseId/:lessonId": () => LessonPage(app),
};

function notFound(path) {
  app.innerHTML = `
    <div class="page">
      <main class="main">
        <div class="container">
          <div class="card">
            <h2>404</h2>
            <p class="muted">Não encontrei a rota: <code>${path}</code></p>
            <button class="btn primary" id="go-home">Ir para início</button>
          </div>
        </div>
      </main>
    </div>
  `;
  app.querySelector("#go-home").addEventListener("click", () => navigate("/"));
}

createRouter(routes, notFound).render();
