export function getRoute() {
  const hash = window.location.hash || "#/";
  const path = hash.replace("#", "");
  return path || "/";
}

export function navigate(path) {
  window.location.hash = `#${path}`;
}

function matchRoute(pattern, path) {
  // pattern: "/course/:courseId/:lessonId"
  const p1 = pattern.split("/").filter(Boolean);
  const p2 = path.split("/").filter(Boolean);

  if (p1.length !== p2.length) return null;

  const params = {};
  for (let i = 0; i < p1.length; i++) {
    const a = p1[i];
    const b = p2[i];
    if (a.startsWith(":")) {
      params[a.slice(1)] = b;
    } else if (a !== b) {
      return null;
    }
  }
  return params;
}

export function createRouter(routes, onNotFound) {
  function render() {
    const path = getRoute();

    // 1) tenta match exato
    if (routes[path]) return routes[path]({ path, params: {} });

    // 2) tenta match por padrão com params
    for (const pattern of Object.keys(routes)) {
      if (!pattern.includes(":")) continue;
      const params = matchRoute(pattern, path);
      if (params) return routes[pattern]({ path, params });
    }

    return onNotFound(path);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("load", render);

  return { render };
}