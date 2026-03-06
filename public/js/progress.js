import { storage } from "./storage.js";
import { getSession } from "./auth.js";

function key() {
  const session = getSession();
  // Separa progresso por usuário.
  return session ? `progress_${session.username}` : "progress_guest";
}

export function getProgress() {
  return storage.get(key(), { completed: {}, certificates: {} });
}

export function markCompleted(courseId, lessonId, value = true) {
  const p = getProgress();
  if (!p.completed[courseId]) p.completed[courseId] = {};
  p.completed[courseId][lessonId] = value;
  storage.set(key(), p);
}

export function isCompleted(courseId, lessonId) {
  const p = getProgress();
  return !!(p.completed?.[courseId]?.[lessonId]);
}

export function isCourseCompleted(courseId, manifest) {
  if (!manifest?.lessons?.length) return false;
  const p = getProgress();
  return manifest.lessons.every((l) => !!p.completed?.[courseId]?.[l.id]);
}

export function getCourseCertificate(courseId) {
  const p = getProgress();
  return p.certificates?.[courseId] || null;
}

export function ensureCourseCertificate(courseId, certificateData) {
  const p = getProgress();
  if (!p.certificates) p.certificates = {};

  if (!p.certificates[courseId]) {
    p.certificates[courseId] = certificateData;
    storage.set(key(), p);
  }

  return p.certificates[courseId];
}

export function clearCourseCertificate(courseId) {
  const p = getProgress();
  if (!p.certificates?.[courseId]) return;
  delete p.certificates[courseId];
  storage.set(key(), p);
}
