const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const apiBase = (configuredBase || "/api").replace(/\/$/, "");
export function apiUrl(path: string) {
  return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}