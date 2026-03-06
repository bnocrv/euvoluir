// public/js/pages/lesson.js
import { Header, bindHeaderEvents } from "../components/header.js";
import { Footer } from "../components/footer.js";
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

function parseCourseRoute(path) {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "course") return null;
  if (parts.length === 2) return { courseId: parts[1], lessonId: null };
  if (parts.length === 3) return { courseId: parts[1], lessonId: parts[2] };
  return null;
}

function renderCodeBlock(code, lang = "html") {
  const languageClass = `language-${lang}`;
  return `
    <pre class="input code-block">
      <code class="${languageClass}">${esc(code)}</code>
    </pre>
  `;
}

function buildQuizInstructions(quiz) {
  if (!quiz?.questions?.length) return "";
  return "Marque A ou B.";
}

function normalizeQuizToAB(quiz) {
  if (!quiz?.questions?.length) return quiz;

  const questions = quiz.questions.map((q, idx) => {
    const options = Array.isArray(q.options) ? q.options : [];
    const correctOriginal =
      options.find((o) => o.key === q.answer) ||
      options[0] || { key: "A", text: "Opcao correta" };

    const wrongOriginal =
      options.find((o) => o.key !== correctOriginal.key) ||
      options[1] || { key: "B", text: "Opcao alternativa" };

    const correctOnA = idx % 2 === 0;
    const abOptions = correctOnA
      ? [
          { key: "A", text: correctOriginal.text },
          { key: "B", text: wrongOriginal.text }
        ]
      : [
          { key: "A", text: wrongOriginal.text },
          { key: "B", text: correctOriginal.text }
        ];

    return {
      ...q,
      options: abOptions,
      answer: correctOnA ? "A" : "B"
    };
  });

  return { ...quiz, questions };
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

function buildLessonNavHTML(manifest, courseId, activeLessonId = null) {
  return manifest.lessons
    .map((l) => {
      const active = l.id === activeLessonId ? "active" : "";
      const done = isCompleted(courseId, l.id);
      const statusClass = done ? "is-done" : "is-pending";
      const statusIcon = done ? "&#10003;" : "&bull;";
      const statusText = done ? "Aula concluida" : "Aula pendente";
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
}

function renderCourseLessonsListPage(app, courseId, manifest) {
  const navHTML = buildLessonNavHTML(manifest, courseId);

  app.innerHTML = `
    <div class="page">
      ${Header()}
      <main class="main">
        <div class="container stack">
          <div class="card pad">
            <div class="row row-between items-start">
              <div>
                <span class="badge">${esc(courseId.toUpperCase())}</span>
                <h2 class="m-0 mt-10">Aulas disponíveis</h2>
                <p class="muted mt-8">Escolha uma aula para abrir o conteúdo.</p>
              </div>
              <span class="badge">${manifest.lessons.length} aulas</span>
            </div>
          </div>

          <div class="card pad stack lessons-only-list">
            ${navHTML}
          </div>

          <div class="row">
            <button class="btn" id="back-dashboard">Voltar para cursos</button>
          </div>
        </div>
      </main>
      ${Footer()}
    </div>
  `;

  bindHeaderEvents(app);
  const backBtn = app.querySelector("#back-dashboard");
  if (backBtn) backBtn.addEventListener("click", () => navigate("/dashboard"));
}

function bindMobileSidebar(app) {
  const sidebar = app.querySelector("#sidebar");
  const toggleSidebarBtn = app.querySelector("#btn-toggle-sidebar");
  const mobileTrailBackdrop = app.querySelector("#mobile-trail-backdrop");
  if (!sidebar || !toggleSidebarBtn) return;

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

export async function LessonPage(app) {
  const session = requireAuth();
  if (!session) return navigate("/login");

  const parsed = parseCourseRoute(getRoute());
  if (!parsed) return navigate("/dashboard");

  const { courseId, lessonId } = parsed;

  let manifest;
  try {
    manifest = await loadCourseManifest(courseId);
  } catch {
    return navigate("/dashboard");
  }

  if (!lessonId) {
    renderCourseLessonsListPage(app, courseId, manifest);
    return;
  }

  let lesson;
  try {
    lesson = await loadLesson(courseId, lessonId);
  } catch {
    return navigate(`/course/${courseId}`);
  }

  const completedNow = isCompleted(courseId, lessonId);
  const navHTML = buildLessonNavHTML(manifest, courseId, lessonId);

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
                Compare com o seu. Nao copie sem entender: labels, ids, names, required e radios com mesmo name.
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
  const quizAB = quiz ? normalizeQuizToAB(quiz) : null;

  const quizHTML = quizAB
    ? `
    <div class="card pad">
      <div class="row row-between">
        <strong>${esc(quizAB.title)}</strong>
        <span class="badge">${quizAB.questions.length} questoes</span>
      </div>
      <div class="mt-10">${renderMD(buildQuizInstructions(quizAB))}</div>

      <div class="stack mt-12" id="quiz-questions">
        ${quizAB.questions
          .map(
            (q) => `
          <div class="card soft pad quiz-card">
            <div class="row row-between">
              <strong>Q${q.id}.</strong>
              <span class="badge" id="qbadge-${q.id}">Nao respondida</span>
            </div>

            <div class="quiz-question">${renderMD(q.question)}</div>

            <div class="row row-wrap mt-10 quiz-options">
              ${q.options
                .map(
                  (opt) =>
                    `<button class="btn quiz-option-btn" data-q="${q.id}" data-a="${esc(opt.key)}">${esc(opt.key)}) ${esc(opt.text)}</button>`
                )
                .join("")}
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
        <span class="badge" id="quiz-score">0/${quizAB.questions.length}</span>
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
            <button class="btn" id="back-lessons">Voltar para aulas</button>
          </aside>

          <section class="stack">
            <div class="card pad">
              <div class="row row-between items-start">
                <div>
                  <h2 class="lesson-title">${esc(lesson.title)}</h2>
                  <div class="muted mt-6">Leia com calma. No final, faca o quiz para fixar.</div>
                </div>
              </div>

              <div class="row row-wrap mt-12">
                <button class="btn primary" id="btn-complete">
                  ${completedNow ? "Marcar aula como pendente" : "Marcar aula como concluida"}
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
      ${Footer()}
    </div>
  `;

  highlightAllInside(app);
  bindHeaderEvents(app);
  bindMobileSidebar(app);

  const backLessonsBtn = app.querySelector("#back-lessons");
  if (backLessonsBtn) backLessonsBtn.addEventListener("click", () => navigate(`/course/${courseId}`));

  app.querySelector("#btn-complete").addEventListener("click", () => {
    markCompleted(courseId, lessonId, !isCompleted(courseId, lessonId));
    LessonPage(app);
  });

  if (quizAB) {
    const answers = {};
    const buttons = app.querySelectorAll("[data-q][data-a]");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const qId = Number(btn.getAttribute("data-q"));
        const choice = btn.getAttribute("data-a");
        answers[qId] = choice;

        const sameQuestionButtons = app.querySelectorAll(`[data-q="${qId}"][data-a]`);
        sameQuestionButtons.forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");

        const q = quizAB.questions.find((x) => x.id === qId);
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
        const total = quizAB.questions.length;
        let score = 0;

        for (const q of quizAB.questions) {
          if (answers[q.id] === q.answer) score++;
        }

        app.querySelector("#quiz-score").textContent = `${score}/${total}`;

        const summary = app.querySelector("#quiz-summary");
        if (Object.keys(answers).length < total) {
          summary.textContent = `Voce respondeu ${Object.keys(answers).length}/${total}. Responda todas para medir seu nivel.`;
          return;
        }

        if (score === total) summary.textContent = "Perfeito! Voce fixou muito bem.";
        else if (score >= 7) summary.textContent = "Muito bom! Reforce as que voce errou e avance.";
        else summary.textContent = "Normal no comeco. Releia os passos e tente de novo.";
      });
    }
  }
}
