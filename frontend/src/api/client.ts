const configuredBaseUrl = import.meta.env.AC_API_BASE_URL?.trim() || ''

export function apiPath(path: string): string {
  if (!configuredBaseUrl) {
    return path
  }
  const base = configuredBaseUrl.replace(/\/+$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
