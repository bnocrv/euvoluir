// auth.js
import { storage } from "./storage.js";

const SESSION_KEY = "session_user";

export async function loadUsers() {
  const res = await fetch("./data/users.json");
  if (!res.ok) throw new Error("Não consegui carregar users.json");
  return res.json();
}

export function getSession() {
  return storage.get(SESSION_KEY, null);
}

export function logout() {
  storage.remove(SESSION_KEY);
}

export async function login(username, password) {
  const users = await loadUsers();
  const found = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!found) return { ok: false, message: "Usuário ou senha inválidos." };

  const session = { username: found.username, name: found.name };
  storage.set(SESSION_KEY, session);
  return { ok: true, session };
}

export function requireAuth() {
  const session = getSession();
  return session;
}