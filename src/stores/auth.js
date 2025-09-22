import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const userPin = ref(null)
  const sessionTimeout = ref(5 * 60 * 1000) // 5 minutes in milliseconds
  const lastActivity = ref(Date.now())
  const isLocked = ref(false)

  // Computed
  const isSessionValid = computed(() => {
    return Date.now() - lastActivity.value < sessionTimeout.value
  })

  // Actions
  const setPin = (pin) => {
    // Hash the PIN for security
    userPin.value = CryptoJS.SHA256(pin).toString()
    localStorage.setItem('mindlifekey_pin', userPin.value)
  }

  const verifyPin = (pin) => {
    const hashedPin = CryptoJS.SHA256(pin).toString()
    return hashedPin === userPin.value
  }

  const authenticate = (pin) => {
    if (verifyPin(pin)) {
      isAuthenticated.value = true
      isLocked.value = false
      updateActivity()
      return true
    }
    return false
  }

  const logout = () => {
    isAuthenticated.value = false
    isLocked.value = true
    lastActivity.value = Date.now()
  }

  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  const checkSession = () => {
    if (!isSessionValid.value && isAuthenticated.value) {
      logout()
    }
  }

  const lockApp = () => {
    isLocked.value = true
    isAuthenticated.value = false
  }

  const unlockApp = (pin) => {
    if (authenticate(pin)) {
      return true
    }
    return false
  }

  const hasPin = computed(() => {
    return userPin.value !== null || localStorage.getItem('mindlifekey_pin') !== null
  })

  const initializeAuth = () => {
    const storedPin = localStorage.getItem('mindlifekey_pin')
    if (storedPin) {
      userPin.value = storedPin
      isLocked.value = true
    }

    // Check session validity every minute
    setInterval(checkSession, 60000)
  }

  const clearAuth = () => {
    userPin.value = null
    isAuthenticated.value = false
    isLocked.value = false
    localStorage.removeItem('mindlifekey_pin')
  }

  // Initialize
  initializeAuth()

  return {
    // State
    isAuthenticated,
    isLocked,
    hasPin,

    // Actions
    setPin,
    authenticate,
    logout,
    updateActivity,
    lockApp,
    unlockApp,
    clearAuth,
  }
})
