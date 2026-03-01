// public/js/api.js
export async function loadCourseManifest(courseId) {
  const res = await fetch(`./data/${courseId}/manifest.json`);
  if (!res.ok) throw new Error(`Não consegui carregar manifest do curso: ${courseId}`);
  return res.json();
}

export async function loadLesson(courseId, lessonId) {
  const manifest = await loadCourseManifest(courseId);
  const item = manifest.lessons.find(l => l.id === lessonId);
  if (!item) throw new Error(`Aula não encontrada no manifest: ${lessonId}`);

  const res = await fetch(`./data/${courseId}/${item.file}`);
  if (!res.ok) throw new Error(`Não consegui carregar a aula: ${item.file}`);
  return res.json();
}