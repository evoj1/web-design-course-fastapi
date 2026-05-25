const API_URL = "http://127.0.0.1:8000";

function normalizeFastApiError(detail) {
  if (!detail) return "Произошла ошибка запроса.";

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== "body").join(" → ")
          : "";
        const msg = item?.msg || JSON.stringify(item);
        return field ? `${field}: ${msg}` : msg;
      })
      .join("; ");
  }

  if (typeof detail === "object") {
    return detail.message || detail.error || JSON.stringify(detail);
  }

  return String(detail);
}

async function parseResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : normalizeFastApiError(data?.detail || data?.message || data);

    throw new Error(message || "Ошибка запроса.");
  }

  return data;
}

export async function uploadRequest(path, formData, headers = {}, method = "POST") {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : normalizeFastApiError(data?.detail || data?.message || data);

    throw new Error(message || "Ошибка загрузки файла.");
  }

  return data;
}

export { API_URL };
