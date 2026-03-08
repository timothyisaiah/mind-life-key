import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from 'src/utils/apiClient'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAuthToken())
  const userEmail = ref(localStorage.getItem('mindlifekey_user_email'))

  const isAuthenticated = computed(() => !!token.value)

  const extractToken = (payload) => {
    return (
      payload?.accessToken ||
      payload?.access_token ||
      payload?.token ||
      payload?.data?.accessToken ||
      payload?.data?.access_token ||
      payload?.data?.token ||
      null
    )
  }

  const acceptToken = (newToken, email) => {
    if (!newToken) return
    token.value = newToken
    setAuthToken(newToken)
    if (email) {
      userEmail.value = email
      localStorage.setItem('mindlifekey_user_email', email)
    }
  }

  const register = async (email, password) => {
    const payload = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { email, password },
    })
    const newToken = extractToken(payload)
    if (!newToken) {
      throw new Error('Registration succeeded but no token was returned.')
    }
    acceptToken(newToken, email)
  }

  const login = async (email, password) => {
    const payload = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    const newToken = extractToken(payload)
    if (!newToken) {
      throw new Error('Login succeeded but no token was returned.')
    }
    acceptToken(newToken, email)
  }

  const logout = () => {
    token.value = null
    userEmail.value = null
    clearAuthToken()
    localStorage.removeItem('mindlifekey_user_email')
  }

  const hydrate = () => {
    token.value = getAuthToken()
  }

  return {
    isAuthenticated,
    userEmail,
    register,
    login,
    acceptToken,
    logout,
    hydrate,
  }
})
