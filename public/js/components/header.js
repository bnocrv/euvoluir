// public/js/components/header.js
import { navigate, getRoute } from "../router.js";
import { getSession, logout } from "../auth.js";

export function Header() {
  const session = getSession();
  const route = getRoute();

  // Se já estiver na tela de login, não mostra o botão "Entrar"
  const isLoginPage = route === "/login";

  const right = session
    ? `<div class="row">
         <span class="muted">Olá, ${session.name}</span>
         <button class="btn" id="btn-logout">Sair</button>
       </div>`
    : isLoginPage
      ? `<span class="muted"> </span>`
      : `<button class="btn primary" id="btn-go-login">Entrar</button>`;

  return `
    <header class="header">
      <div class="container header-inner">
        <a class="brand" href="#/">
          <span class="brand-dot"></span>
          <span>Fina Dev Academy</span>
        </a>
        ${right}
      </div>
    </header>
  `;
}

export function bindHeaderEvents(rootEl) {
  const btnLogin = rootEl.querySelector("#btn-go-login");
  if (btnLogin) btnLogin.addEventListener("click", () => navigate("/login"));

  const btnLogout = rootEl.querySelector("#btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      logout();
      navigate("/login");
    });
  }
}