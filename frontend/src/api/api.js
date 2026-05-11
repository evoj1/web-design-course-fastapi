const API_URL = "http://127.0.0.1:8000";

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (Array.isArray(data?.detail)) {
      throw new Error(data.detail.map(e => e.msg).join("; "));
    }

    throw new Error(data?.detail || "Ошибка запроса");
  }

  return data;
}