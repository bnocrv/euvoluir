// public/js/pages/lesson.js
import { Header, bindHeaderEvents } from "../components/header.js";
import { requireAuth } from "../auth.js";
import { navigate, getRoute } from "../router.js";
import { loadCourseManifest, loadLesson } from "../api.js";
import { isCompleted, markCompleted } from "../progress.js";

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderInline(md) {
  let out = esc(md);
  out = out.replace(/`([^`]+)`/g, (_, c) => `<span class="inline-code">${c}</span>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, (_, b) => `<strong>${b}</strong>`);
  return out;
}

function renderMD(text) {
  const raw = String(text ?? "");
  const lines = raw.split("\n");
  let html = "";
  let inList = false;

  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      closeList();
      continue;
    }

    if (t.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${renderInline(t.slice(2))}</li>`;
      continue;
    }

    closeList();
    html += `<p>${renderInline(t)}</p>`;
  }

  closeList();
  return `<div class="md">${html}</div>`;
}

function parseLessonRoute(path) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 3) return null;
  return { courseId: parts[1], lessonId: parts[2] };
}

function renderCodeBlock(code, lang = "html") {
  const languageClass = `language-${lang}`;
  return `
    <pre class="input code-block">
      <code class="${languageClass}">${esc(code)}</code>
    </pre>
  `;
}

function highlightAllInside(root) {
  if (!window.hljs) return;

  const blocks = root.querySelectorAll("pre code");
  blocks.forEach((block) => {
    try {
      window.hljs.highlightElement(block);
    } catch {
      // Ignore highlight errors to avoid breaking page render.
    }
  });
}

export async function LessonPage(app) {
  const session = requireAuth();
  if (!session) return navigate("/login");

  const parsed = parseLessonRoute(getRoute());
  if (!parsed) return navigate("/dashboard");

  const { courseId, lessonId } = parsed;

  const manifest = await loadCourseManifest(courseId);
  const lesson = await loadLesson(courseId, lessonId);
  const completedNow = isCompleted(courseId, lessonId);

  const navHTML = manifest.lessons
    .map((l) => {
      const active = l.id === lessonId ? "active" : "";
      const done = isCompleted(courseId, l.id);
      const statusClass = done ? "is-done" : "is-pending";
      const statusIcon = done ? "✓" : "•";
      const statusText = done ? "Aula concluída" : "Aula pendente";
      return `
        <a class="nav-item ${active}" href="#/course/${courseId}/${l.id}">
          <div class="row items-start">
            <div class="lesson-main">
              <span class="lesson-state ${statusClass}" aria-hidden="true">${statusIcon}</span>
              <div>
                <span class="course-code">${esc(l.title)}</span>
                <span class="lesson-state-text">${statusText}</span>
              </div>
            </div>
          </div>
        </a>
      `;
    })
    .join("");

  const stepsHTML = (lesson.steps || [])
    .map(
      (st, i) => `
      <div class="card pad">
        <div class="step-title">Parte ${i + 1}</div>
        <h3 class="step-heading">${esc(st.title)}</h3>
        ${renderMD(st.body)}
      </div>
    `
    )
    .join("");

  const extraModelHTML =
    lesson?.extra?.modelHtml
      ? `
        <div class="card pad">
          <div class="row row-between items-start">
            <div>
              <strong>Modelo do Projeto (HTML completo)</strong>
              <div class="muted mt-6">
                Compare com o seu. Não copie sem entender: labels, ids, names, required e radios com mesmo name.
              </div>
            </div>
            <span class="badge">modelo</span>
          </div>

          <div class="mt-12">
            ${renderCodeBlock(lesson.extra.modelHtml, "html")}
          </div>
        </div>
      `
      : "";

  const quiz = lesson.quiz;

  const quizHTML = quiz
    ? `
    <div class="card pad">
      <div class="row row-between">
        <strong>${esc(quiz.title)}</strong>
        <span class="badge">${quiz.questions.length} questões</span>
      </div>
      <div class="mt-10">${renderMD(quiz.instructions)}</div>

      <div class="stack mt-12" id="quiz-questions">
        ${quiz.questions
          .map(
            (q) => `
          <div class="card soft pad quiz-card">
            <div class="row row-between">
              <strong>Q${q.id}.</strong>
              <span class="badge" id="qbadge-${q.id}">Não respondida</span>
            </div>

            <div class="quiz-question">${renderMD(q.question)}</div>

            <div class="row row-wrap mt-10">
              <button class="btn" data-q="${q.id}" data-a="A">A) ${esc(q.options[0].text)}</button>
              <button class="btn" data-q="${q.id}" data-a="B">B) ${esc(q.options[1].text)}</button>
            </div>

            <div class="muted quiz-feedback" id="qfeedback-${q.id}"></div>
          </div>
        `
          )
          .join("")}
      </div>

      <hr class="hr"/>

      <div class="row row-between row-wrap">
        <button class="btn primary" id="btn-finish-quiz">Finalizar quiz</button>
        <span class="badge" id="quiz-score">0/${quiz.questions.length}</span>
      </div>

      <div class="muted quiz-summary" id="quiz-summary"></div>
    </div>
  `
    : "";

  app.innerHTML = `
    <div class="page">
      ${Header()}
      <main class="main">
        <div class="container lesson-shell">

          <aside class="card pad sticky" id="sidebar">
            <div>
              <div class="badge">${esc(courseId.toUpperCase())}</div>
              <div class="course-title">${esc(manifest.title)}</div>
              <div class="muted mt-6">Trilha de aulas</div>
            </div>
            <hr class="hr"/>
            <div class="stack">${navHTML}</div>
            <hr class="hr"/>
            <button class="btn" id="back-dashboard">Voltar</button>
          </aside>

          <section class="stack">
            <div class="card pad">
              <div class="row row-between items-start">
                <div>
                  <h2 class="lesson-title">${esc(lesson.title)}</h2>
                  <div class="muted mt-6">
                    Leia com calma. No final, faça o quiz para fixar.
                  </div>
                </div>
              </div>

              <div class="row row-wrap mt-12">
                <button class="btn primary" id="btn-complete">
                  ${completedNow ? "↩ Marcar aula como pendente" : "✓ Marcar aula como concluída"}
                </button>
              </div>
            </div>

            ${stepsHTML}

            ${extraModelHTML}

            ${quizHTML}
          </section>
        </div>
        <button class="mobile-trail-fab" id="btn-toggle-sidebar" aria-controls="sidebar" aria-expanded="false" aria-label="Abrir trilha de aulas">></button>
        <div class="mobile-trail-backdrop" id="mobile-trail-backdrop"></div>
      </main>
    </div>
  `;

  highlightAllInside(app);
  bindHeaderEvents(app);

  const sidebar = app.querySelector("#sidebar");
  const toggleSidebarBtn = app.querySelector("#btn-toggle-sidebar");
  const mobileTrailBackdrop = app.querySelector("#mobile-trail-backdrop");
  if (sidebar && toggleSidebarBtn) {
    const syncToggleUI = (isOpen) => {
      toggleSidebarBtn.textContent = isOpen ? "<" : ">";
      toggleSidebarBtn.setAttribute("aria-expanded", String(isOpen));
      toggleSidebarBtn.setAttribute("aria-label", isOpen ? "Fechar trilha de aulas" : "Abrir trilha de aulas");
      if (mobileTrailBackdrop) mobileTrailBackdrop.classList.toggle("open", isOpen);
    };

    toggleSidebarBtn.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("open");
      syncToggleUI(isOpen);
    });

    if (mobileTrailBackdrop) {
      mobileTrailBackdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        syncToggleUI(false);
      });
    }
  }

  app.querySelector("#back-dashboard").addEventListener("click", () => navigate("/dashboard"));

  app.querySelector("#btn-complete").addEventListener("click", () => {
    markCompleted(courseId, lessonId, !isCompleted(courseId, lessonId));
    LessonPage(app);
  });

  if (quiz) {
    const answers = {};
    const buttons = app.querySelectorAll("[data-q][data-a]");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const qId = Number(btn.getAttribute("data-q"));
        const choice = btn.getAttribute("data-a");
        answers[qId] = choice;

        const q = quiz.questions.find((x) => x.id === qId);
        const badge = app.querySelector(`#qbadge-${qId}`);
        const feedback = app.querySelector(`#qfeedback-${qId}`);

        const ok = choice === q.answer;
        badge.textContent = ok ? "Correta" : "Errada";
        badge.classList.remove("quiz-ok", "quiz-bad");
        badge.classList.add(ok ? "quiz-ok" : "quiz-bad");

        feedback.innerHTML = ok
          ? `<span class="quiz-feedback-highlight">Boa!</span> ${esc(q.explain)}`
          : `<span class="quiz-feedback-highlight">Quase.</span> ${esc(q.explain)}`;
      });
    });

    const finishBtn = app.querySelector("#btn-finish-quiz");
    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        const total = quiz.questions.length;
        let score = 0;

        for (const q of quiz.questions) {
          if (answers[q.id] === q.answer) score++;
        }

        app.querySelector("#quiz-score").textContent = `${score}/${total}`;

        const summary = app.querySelector("#quiz-summary");
        if (Object.keys(answers).length < total) {
          summary.textContent = `Você respondeu ${Object.keys(answers).length}/${total}. Responda todas para medir seu nível.`;
          return;
        }

        if (score === total) summary.textContent = "Perfeito! Você fixou muito bem.";
        else if (score >= 7) summary.textContent = "Muito bom! Reforce as que você errou e avance.";
        else summary.textContent = "Normal no começo. Releia os passos e tente de novo.";
      });
    }
  }
}
