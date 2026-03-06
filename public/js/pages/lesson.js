// public/js/pages/lesson.js
import { Header, bindHeaderEvents } from "../components/header.js";
import { Footer } from "../components/footer.js";
import { requireAuth } from "../auth.js";
import { navigate, getRoute } from "../router.js";
import { loadCourseManifest, loadLesson } from "../api.js";
import {
  isCompleted,
  markCompleted,
  isCourseCompleted,
  ensureCourseCertificate,
  clearCourseCertificate
} from "../progress.js";

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

function getCourseBadgeLabel(courseId) {
  const labels = {
    word: "Word",
    excel: "Excel",
    logistica: "Logística",
    adm: "Administração",
    financas: "Finanças",
    compras: "Compras",
    "gestao-pessoas": "Gestão de Pessoas",
    html: "HTML",
    css: "CSS",
    js: "JavaScript",
    powerpoint: "PowerPoint"
  };

  const base = labels[courseId] || courseId.replaceAll("-", " ");
  return base.toLocaleUpperCase("pt-BR");
}

function formatDatePT(dateIso) {
  const date = new Date(dateIso);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function buildCertificateSpecialization(manifest) {
  const topic = manifest?.title ? manifest.title.split("—")[0].trim() : "especialização";
  return `Especialização introdutória em ${topic}, com domínio dos principais fundamentos e práticas essenciais.`;
}

function estimateWorkloadHours(manifest) {
  const lessons = manifest?.lessons?.length || 0;
  return lessons * 2;
}

function buildCertificateCode(session, courseId, issuedAt) {
  const date = new Date(issuedAt);
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const user = (session?.username || "aluno").slice(0, 4).toUpperCase();
  const course = String(courseId || "CURSO").slice(0, 4).toUpperCase();
  return `FS-${course}-${user}-${y}${m}${d}`;
}

function renderCertificateCard(certificate) {
  return `
    <div class="card pad certificate-card" id="certificate-card">
      <div class="certificate-sheet">
        <div class="certificate-accent-top"></div>
        <div class="certificate-accent-bottom"></div>

        <div class="certificate-topline">
          <div class="certificate-brand-row">
            <span class="certificate-logo" aria-hidden="true">
              <span class="certificate-logo-inner">
                <span class="certificate-logo-f">
                  <span class="certificate-logo-stem"></span>
                  <span class="certificate-logo-top"></span>
                  <span class="certificate-logo-mid"></span>
                </span>
                <span class="certificate-logo-underline"></span>
              </span>
            </span>
            <span class="certificate-brand-name">FINA ESTAMPA</span>
          </div>

          <div class="certificate-seal" aria-label="Selo oficial">
            <span class="certificate-seal-ring">
              <span class="certificate-seal-stars">★ ★ ★</span>
              <span class="certificate-seal-text">OFICIAL</span>
            </span>
            <span class="certificate-seal-ribbons">
              <span class="certificate-seal-ribbon certificate-seal-ribbon-left"></span>
              <span class="certificate-seal-ribbon certificate-seal-ribbon-right"></span>
            </span>
          </div>
        </div>

        <div class="certificate-heading">
          <div class="certificate-header">CERTIFICADO</div>
          <div class="certificate-subtitle">de conclusão</div>
        </div>

        <div class="certificate-body">
          <p class="certificate-chip">confere o presente certificado a</p>
          <h2 class="certificate-student">${esc(certificate.studentName)}</h2>
          <p class="certificate-text">pela conclusão do curso</p>
          <h3 class="certificate-course">${esc(certificate.courseTitle)}</h3>
          <p class="certificate-text certificate-specialization">
            ${esc(certificate.specialization)}
          </p>
          <p class="certificate-date">Emitido em ${esc(formatDatePT(certificate.issuedAt))}</p>
          <div class="certificate-meta">
            <span><strong>Carga horária:</strong> ${esc(String(certificate.workloadHours))} horas</span>
            <span><strong>Modalidade:</strong> Formação online</span>
            <span><strong>Código:</strong> ${esc(certificate.certificateCode)}</span>
          </div>
        </div>
        <div class="certificate-footer">
          <div class="certificate-signature-block">
            <div class="certificate-signature-name">Raquel Salles</div>
            <div class="certificate-signature-role">Diretora de Recursos Humanos</div>
          </div>
          <div class="certificate-legal-block">
            <div class="certificate-brand">FINA ESTAMPA</div>
            <div class="certificate-legal">Certificado de capacitação interna</div>
          </div>
        </div>
      </div>
      <div class="row row-wrap mt-12 certificate-actions">
        <button class="btn primary" id="btn-save-certificate">Salvar certificado</button>
      </div>
    </div>
  `;
}

function buildCertificatePrintHTML(certificate) {
  return `
  <!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Certificado - ${esc(certificate.courseTitle)}</title>
      <style>
        @page { size: A4 landscape; margin: 0; }
        html, body { width: 297mm; height: 210mm; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #ffffff; }
        .paper {
          position: relative;
          overflow: hidden;
          width: 297mm;
          height: 210mm;
          box-sizing: border-box;
          background: #fff;
          border: 3mm solid #0f0f0f;
          padding: 12mm 13mm 10mm;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          gap: 4mm;
          background-image:
            radial-gradient(circle at 50% 46%, rgba(201,18,18,.05), transparent 45%),
            linear-gradient(180deg, rgba(0,0,0,.015), rgba(0,0,0,0));
        }
        .topline{
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .brand-row{
          display: flex;
          align-items: center;
          gap: 3mm;
        }
        .logo{
          width: 11mm;
          height: 11mm;
          border: .4mm solid #111;
          border-radius: .8mm;
          background: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .logo-inner{
          width: 8.6mm;
          height: 8.6mm;
          border: .35mm solid #222;
          background: #151515;
          position: relative;
        }
        .f-stem,.f-top,.f-mid{
          position: absolute;
          background: #ffffff;
        }
        .f-stem{ left: 1.1mm; top: 1mm; width: .9mm; height: 5.8mm; }
        .f-top{ left: 1.1mm; top: 1mm; width: 4.8mm; height: .9mm; }
        .f-mid{ left: 1.1mm; top: 3.4mm; width: 3.3mm; height: .9mm; }
        .f-underline{
          position: absolute;
          left: 3.8mm;
          bottom: 1mm;
          width: 3.2mm;
          height: .8mm;
          background: #c91212;
        }
        .brand-name{
          font-size: 4.1mm;
          letter-spacing: .5mm;
          color: #111;
          font-weight: 800;
        }
        .accent-top, .accent-bottom {
          position: absolute;
          left: 0;
          right: 0;
          height: 3.5mm;
        }
        .accent-top { top: 0; background: linear-gradient(90deg, #111111 0 84%, #c91212 100%); }
        .accent-bottom { bottom: 0; background: linear-gradient(90deg, #c91212 0 18%, #111111 100%); }

        .seal {
          width: 25mm;
          height: 32mm;
          color: #111;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
        }
        .seal-ring {
          width: 24mm;
          height: 24mm;
          border-radius: 50%;
          border: .8mm solid #c91212;
          outline: .4mm solid #111;
          outline-offset: -2mm;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }
        .seal-stars {
          font-size: 2.5mm;
          color: #c91212;
          letter-spacing: .3mm;
          line-height: 1;
        }
        .seal-text {
          margin-top: 1mm;
          font-size: 3.8mm;
          font-weight: 800;
          letter-spacing: .6mm;
        }
        .seal-ribbons {
          margin-top: .4mm;
          display: flex;
          gap: 1.4mm;
        }
        .seal-ribbon {
          width: 0;
          height: 0;
          border-left: 2.4mm solid transparent;
          border-right: 2.4mm solid transparent;
          border-top: 6mm solid #111;
        }
        .seal-ribbon.red { border-top-color: #c91212; }
        .seal-ribbon.black { border-top-color: #111; }
        .seal-ribbon.red.dark { border-top-color: #8f0e0e; }
        .seal-ribbon.black.dark { border-top-color: #2a2a2a; }
        .inner-frame {
          position: absolute;
          inset: 8mm;
          border: .5mm solid rgba(17,17,17,.35);
          pointer-events: none;
        }

        .heading { text-align: center; }
        .title { font-size: 16mm; letter-spacing: .8mm; margin: 0; text-transform: uppercase; color: #111; line-height: .95; }
        .subtitle { font-size: 9.2mm; margin: 1mm 0 0; color: #262626; }
        .body {
          border: .5mm dashed rgba(17,17,17,.28);
          border-radius: 2.2mm;
          padding: 4mm 5mm;
          text-align: center;
        }
        .chip {
          display: inline-block;
          margin: 0 0 3.5mm;
          padding: 1.6mm 4mm;
          border-radius: 999px;
          color: #fff;
          font-size: 3.8mm;
          background: #111111;
          border: .35mm solid #c91212;
        }
        .text { font-size: 5.1mm; color: #222; margin: 2.2mm 0; }
        .student {
          font-size: 18mm;
          margin: 1.5mm 0;
          font-family: "Times New Roman", serif;
          font-style: italic;
          color: #111111;
        }
        .course { font-size: 7mm; margin: 1.6mm 0; color: #121212; font-weight: 700; }
        .spec { font-size: 4.8mm; color: #2f2f2f; margin-top: 2.8mm; }
        .date { margin-top: 2.8mm; font-size: 4.1mm; color: #4f4f4f; }
        .meta{
          margin-top: 2.5mm;
          font-size: 3.5mm;
          color: #323232;
          display: flex;
          justify-content: center;
          gap: 8mm;
          flex-wrap: wrap;
        }
        .footer{
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: end;
          gap: 10mm;
          margin-top: 2mm;
        }
        .sign{
          text-align: left;
        }
        .sign-name {
          margin-top: 0;
          font-size: 12mm;
          font-family: "Times New Roman", serif;
          font-style: italic;
          color: #111111;
        }
        .sign-role { margin-top: 1.4mm; font-size: 3.4mm; color: #444; }
        .legal{
          text-align: right;
        }
        .brand { margin-top: 0; font-weight: 800; font-size: 4.6mm; letter-spacing: .4mm; color: #c91212; }
        .legal-text{ margin-top: 1.2mm; font-size: 3.3mm; color: #404040; }
      </style>
    </head>
    <body>
      <div class="paper">
        <div class="inner-frame"></div>
        <div class="accent-top"></div>
        <div class="accent-bottom"></div>

        <div class="topline">
          <div class="brand-row">
            <span class="logo">
              <span class="logo-inner">
                <span class="f-stem"></span>
                <span class="f-top"></span>
                <span class="f-mid"></span>
                <span class="f-underline"></span>
              </span>
            </span>
            <span class="brand-name">FINA ESTAMPA</span>
          </div>
          <div class="seal">
            <span class="seal-ring">
              <span class="seal-stars">★ ★ ★</span>
              <span class="seal-text">OFICIAL</span>
            </span>
            <span class="seal-ribbons">
              <span class="seal-ribbon red"></span>
              <span class="seal-ribbon black"></span>
              <span class="seal-ribbon red dark"></span>
              <span class="seal-ribbon black dark"></span>
            </span>
          </div>
        </div>

        <div class="heading">
          <h1 class="title">CERTIFICADO</h1>
          <h2 class="subtitle">de conclusão</h2>
        </div>

        <div class="body">
          <p class="chip">confere o presente certificado a</p>
          <h2 class="student">${esc(certificate.studentName)}</h2>
          <p class="text">pela conclusão do curso</p>
          <h3 class="course">${esc(certificate.courseTitle)}</h3>
          <p class="spec">${esc(certificate.specialization)}</p>
          <p class="date">Emitido em ${esc(formatDatePT(certificate.issuedAt))}</p>
          <div class="meta">
            <span><strong>Carga horária:</strong> ${esc(String(certificate.workloadHours))} horas</span>
            <span><strong>Modalidade:</strong> Formação online</span>
            <span><strong>Código:</strong> ${esc(certificate.certificateCode)}</span>
          </div>
        </div>

        <div class="footer">
          <div class="sign">
            <div class="sign-name">Raquel Salles</div>
            <div class="sign-role">Diretora de Recursos Humanos</div>
          </div>
          <div class="legal">
            <div class="brand">FINA ESTAMPA</div>
            <div class="legal-text">Certificado de capacitação interna</div>
          </div>
        </div>
      </div>
      <script>window.onload = () => window.print();</script>
    </body>
  </html>
  `;
}

function bindCertificateActions(app, certificate) {
  const saveBtn = app.querySelector("#btn-save-certificate");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.open();
      printWindow.document.write(buildCertificatePrintHTML(certificate));
      printWindow.document.close();
    });
  }
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
      options[0] || { key: "A", text: "Opção correta" };

    const wrongOriginal =
      options.find((o) => o.key !== correctOriginal.key) ||
      options[1] || { key: "B", text: "Opção alternativa" };

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
}

function renderCourseLessonsListPage(app, session, courseId, manifest) {
  const navHTML = buildLessonNavHTML(manifest, courseId);
  const completedCourse = isCourseCompleted(courseId, manifest);
  const certificate = completedCourse
    ? ensureCourseCertificate(courseId, {
        studentName: session.name,
        courseTitle: manifest.title,
        specialization: buildCertificateSpecialization(manifest),
        workloadHours: estimateWorkloadHours(manifest),
        certificateCode: buildCertificateCode(session, courseId, new Date().toISOString()),
        issuedAt: new Date().toISOString()
      })
    : null;

  app.innerHTML = `
    <div class="page">
      ${Header()}
      <main class="main">
        <div class="container stack">
          <div class="card pad">
            <div class="row row-between items-start">
              <div>
                <span class="badge">${esc(getCourseBadgeLabel(courseId))}</span>
                <h2 class="m-0 mt-10">Aulas disponíveis</h2>
                <p class="muted mt-8">Escolha uma aula para abrir o conteúdo.</p>
              </div>
              <span class="badge">${manifest.lessons.length} aulas</span>
            </div>
          </div>

          ${certificate ? renderCertificateCard(certificate) : ""}

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
  if (certificate) bindCertificateActions(app, certificate);
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
    renderCourseLessonsListPage(app, session, courseId, manifest);
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
  const quizAB = quiz ? normalizeQuizToAB(quiz) : null;

  const quizHTML = quizAB
    ? `
    <div class="card pad">
      <div class="row row-between">
        <strong>${esc(quizAB.title)}</strong>
        <span class="badge">${quizAB.questions.length} questões</span>
      </div>
      <div class="mt-10">${renderMD(buildQuizInstructions(quizAB))}</div>

      <div class="stack mt-12" id="quiz-questions">
        ${quizAB.questions
          .map(
            (q) => `
          <div class="card soft pad quiz-card">
            <div class="row row-between">
              <strong>Q${q.id}.</strong>
              <span class="badge" id="qbadge-${q.id}">Não respondida</span>
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
              <div class="badge">${esc(getCourseBadgeLabel(courseId))}</div>
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
                  <div class="muted mt-6">Leia com calma. No final, faça o quiz para fixar.</div>
                </div>
              </div>

              <div class="row row-wrap mt-12">
                <button class="btn primary" id="btn-complete">
                  ${completedNow ? "Marcar aula como pendente" : "Marcar aula como concluída"}
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
    const nextValue = !isCompleted(courseId, lessonId);
    markCompleted(courseId, lessonId, nextValue);

    const doneNow = isCourseCompleted(courseId, manifest);
    if (doneNow) {
      ensureCourseCertificate(courseId, {
        studentName: session.name,
        courseTitle: manifest.title,
        specialization: buildCertificateSpecialization(manifest),
        workloadHours: estimateWorkloadHours(manifest),
        certificateCode: buildCertificateCode(session, courseId, new Date().toISOString()),
        issuedAt: new Date().toISOString()
      });
      navigate(`/course/${courseId}`);
      return;
    }

    clearCourseCertificate(courseId);
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

