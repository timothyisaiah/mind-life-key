const TOKEN_KEY = 'mindlifekey_token'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_DEBUG = import.meta.env.VITE_API_DEBUG === 'true'

const buildUrl = (path) => {
  if (!API_BASE_URL) return path
  if (API_BASE_URL.endsWith('/') && path.startsWith('/')) {
    return `${API_BASE_URL.slice(0, -1)}${path}`
  }
  if (!API_BASE_URL.endsWith('/') && !path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`
  }
  return `${API_BASE_URL}${path}`
}

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY)

export const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

const parseResponse = async (response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, headers } = options
  const token = getAuthToken()
  const url = buildUrl(path)
  const startedAt = performance.now()

  const requestHeaders = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  if (API_DEBUG) {
    console.info(`[MindLifeKey] -> ${method} ${url}`)
  }

  let response
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (API_DEBUG) {
      const elapsedMs = Math.round(performance.now() - startedAt)
      console.info(`[MindLifeKey] !! ${method} ${url} failed (${elapsedMs} ms)`)
    }
    throw error
  }

  const payload = await parseResponse(response)
  if (API_DEBUG) {
    const elapsedMs = Math.round(performance.now() - startedAt)
    console.info(`[MindLifeKey] <- ${method} ${url} ${response.status} (${elapsedMs} ms)`)
  }
  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Request failed'
    throw new Error(message)
  }

  return payload
}
