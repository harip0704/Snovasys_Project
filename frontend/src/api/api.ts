
const API_BASE_URL = "http://localhost:8081";

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}

async function getErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as ApiErrorResponse;

      return (
        data.message ||
        data.error ||
        data.details ||
        `Request failed with status ${response.status}`
      );
    } catch {
      return `Request failed with status ${response.status}`;
    }
  }

  try {
    const message = await response.text();

    return (
      message ||
      `Request failed with status ${response.status}`
    );
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  responseType: "json" | "blob" = "json",
): Promise<T> {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${API_BASE_URL}${normalizedPath}`;
  const headers = new Headers(options.headers);

  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  } else if (
    options.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to the backend at ${API_BASE_URL}. ` +
        "Check that Spring Boot is running and CORS is configured.",
    );
  }

  if (!response.ok) {
    const message = await getErrorMessage(response);

    throw new Error(
      `${message} [${options.method || "GET"} ${normalizedPath}]`,
    );
  }

  if (
    response.status === 204 ||
    response.status === 205
  ) {
    return undefined as T;
  }

  if (responseType === "blob") {
    return (await response.blob()) as T;
  }

  const contentLength = response.headers.get("content-length");

  if (contentLength === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}
