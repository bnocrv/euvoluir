// public/js/api.js
function resolveCourseDataDir(courseId) {
  // Backward compatibility for old route name.
  if (courseId === "rh") return "gestao-pessoas";
  return courseId;
}

export async function loadCourseManifest(courseId) {
  const dataDir = resolveCourseDataDir(courseId);
  const res = await fetch(`./data/${dataDir}/manifest.json`);
  if (!res.ok) throw new Error(`Não consegui carregar manifest do curso: ${courseId}`);
  return res.json();
}

export async function loadLesson(courseId, lessonId) {
  const manifest = await loadCourseManifest(courseId);
  const item = manifest.lessons.find((l) => l.id === lessonId);
  if (!item) throw new Error(`Aula não encontrada no manifest: ${lessonId}`);

  const dataDir = resolveCourseDataDir(courseId);
  const res = await fetch(`./data/${dataDir}/${item.file}`);
  if (!res.ok) throw new Error(`Não consegui carregar a aula: ${item.file}`);
  return res.json();
}

