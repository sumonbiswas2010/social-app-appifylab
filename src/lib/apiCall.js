let refreshing = null;

async function refreshSession() {
  refreshing ||= fetch('/api/auth/refresh', { method: 'POST' })
    .then((r) => r.ok)
    .finally(() => (refreshing = null));
  return refreshing;
}

// Central fetch wrapper: JSON/FormData bodies, unified errors, auto token refresh
export async function apiCall(path, { method = 'GET', body, retry = true } = {}) {
  const opts = { method, headers: {} };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(path, opts);

  if (res.status === 401 && retry && !path.startsWith('/api/auth/')) {
    if (await refreshSession()) return apiCall(path, { method, body, retry: false });
    window.location.href = '/login';
    return new Promise(() => {});
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Something went wrong');
  }
  return json.data;
}
