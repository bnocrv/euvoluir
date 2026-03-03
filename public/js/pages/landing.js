// public/js/pages/landing.js
import { Header, bindHeaderEvents } from "../components/header.js";
import { Footer } from "../components/footer.js";
import { navigate } from "../router.js";
import { getSession } from "../auth.js";

export function LandingPage(app) {
  const session = getSession();
  if (session) return navigate("/dashboard");

  const highlights = [
    {
      title: "Desenvolvimento contínuo",
      description:
        "Conteúdo prático e detalhado para você aprimorar suas competências no dia a dia da Fina Estampa. Acesse cursos de Administração, Finanças, Pacote Office, Desenvolvimento Web e muito mais para impulsionar sua carreira.",
    }
  ];

  app.innerHTML = `
    <div class="page">
      ${Header()}
      <main class="main">
        <div class="container">
          <section class="hero">
            <h1>Bem-vindo ao Fina Skills: O canal de estudos da Fina Estampa.</h1>
            <p class="muted">
              Uma plataforma exclusiva para nossos colaboradores desenvolverem novas habilidades e crescerem profissionalmente.
            </p>

            <h2 class="landing-about-title mt-16">Sobre o Fina Skills</h2>

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
      ${Footer()}
    </div>
  `;

  bindHeaderEvents(app);
  app.querySelector("#landing-enter").addEventListener("click", () => navigate("/login"));
}
