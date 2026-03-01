import { storage } from "./storage.js";
import { getSession } from "./auth.js";

function key() {
  const session = getSession();
  // separa progresso por usuário
  return session ? `progress_${session.username}` : "progress_guest";
}

export function getProgress() {
  return storage.get(key(), { completed: {} });
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