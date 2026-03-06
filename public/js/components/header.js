// public/js/components/header.js
import { navigate, getRoute } from "../router.js";
import { getSession, logout } from "../auth.js";

function getBackTarget(route, session) {
  const parts = route.split("/").filter(Boolean);

  if (route === "/dashboard") return session ? "" : "/";
  if (route === "/login") return session ? "/dashboard" : "/";
  if (parts[0] === "course" && parts.length === 2) return "/dashboard";
  if (parts[0] === "course" && parts.length >= 3) return `/course/${parts[1]}`;
  return "";
}

export function Header() {
  const session = getSession();
  const route = getRoute();

  const isLoginPage = route === "/login";
  const isLandingPage = route === "/";

  const right = session
    ? `<div class="row">
         <span class="muted">Olá, ${session.name}</span>
         <button class="btn" id="btn-logout">Sair</button>
       </div>`
    : isLoginPage || isLandingPage
      ? `<span class="muted"> </span>`
      : `<button class="btn primary" id="btn-go-login">Entrar</button>`;

  const backTarget = getBackTarget(route, session);
  const left = backTarget
    ? `<button class="btn header-back-link" id="btn-header-back" data-target="${backTarget}" aria-label="Voltar para a tela anterior de navegação">
         <span class="brand-mark" aria-hidden="true">
           <span class="brand-mark-inner">
             <span class="brand-f-glyph">
               <span class="brand-f-stem"></span>
               <span class="brand-f-top"></span>
               <span class="brand-f-mid"></span>
             </span>
             <span class="brand-f-underline"></span>
           </span>
         </span>
         <span class="brand-text">Skills</span>
       </button>`
    : "";

  return `
    <header class="header">
      <div class="container header-inner">
        ${left}
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

  const btnHeaderBack = rootEl.querySelector("#btn-header-back");
  if (btnHeaderBack) {
    btnHeaderBack.addEventListener("click", () => {
      const target = btnHeaderBack.getAttribute("data-target") || "/";
      navigate(target);
    });
  }
}
