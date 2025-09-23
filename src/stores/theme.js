import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State
  const isDarkMode = ref(false)
  const systemPreference = ref('light')

  // Getters
  const currentTheme = computed(() => (isDarkMode.value ? 'dark' : 'light'))

  const themeColors = computed(() => {
    if (isDarkMode.value) {
      return {
        // Dark Mode Palette
        primary: '#0F172A', // Deep Navy
        secondary: '#14B8A6', // Teal
        accent: '#FBBF24', // Warm Amber
        background: '#0F172A', // Dark Navy / Near Black
        surface: '#1E293B', // Slate Gray
        textPrimary: '#F9FAFB', // Near White
        textSecondary: '#9CA3AF', // Cool Gray
        profit: '#34D399', // Bright Green
        loss: '#F87171', // Soft Red
        // Additional semantic colors
        success: '#34D399',
        error: '#F87171',
        warning: '#FBBF24',
        info: '#14B8A6',
      }
    } else {
      return {
        // Light Mode Palette
        primary: '#1E3A8A', // Navy Blue
        secondary: '#10B981', // Emerald Green
        accent: '#F59E0B', // Amber Gold
        background: '#F9FAFB', // Light Gray / Off-White
        surface: '#FFFFFF', // Pure White
        textPrimary: '#111827', // Near Black
        textSecondary: '#6B7280', // Muted Gray
        profit: '#059669', // Deep Emerald
        loss: '#DC2626', // Muted Red
        // Additional semantic colors
        success: '#059669',
        error: '#DC2626',
        warning: '#F59E0B',
        info: '#10B981',
      }
    }
  })

  // Actions
  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value
    updateDocumentTheme()
    saveThemePreference()
  }

  function setTheme(theme) {
    isDarkMode.value = theme === 'dark'
    updateDocumentTheme()
    saveThemePreference()
  }

  function setSystemPreference() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    systemPreference.value = prefersDark ? 'dark' : 'light'
    isDarkMode.value = prefersDark
    updateDocumentTheme()
  }

  function updateDocumentTheme() {
    const root = document.documentElement
    const colors = themeColors.value

    // Update CSS custom properties
    root.style.setProperty('--q-primary', colors.primary)
    root.style.setProperty('--q-secondary', colors.secondary)
    root.style.setProperty('--q-accent', colors.accent)
    root.style.setProperty('--q-background', colors.background)
    root.style.setProperty('--q-surface', colors.surface)
    root.style.setProperty('--q-text-primary', colors.textPrimary)
    root.style.setProperty('--q-text-secondary', colors.textSecondary)
    root.style.setProperty('--q-profit', colors.profit)
    root.style.setProperty('--q-loss', colors.loss)
    root.style.setProperty('--q-success', colors.success)
    root.style.setProperty('--q-error', colors.error)
    root.style.setProperty('--q-warning', colors.warning)
    root.style.setProperty('--q-info', colors.info)

    // Update document class for theme-specific styling
    root.classList.remove('theme-light', 'theme-dark')
    root.classList.add(`theme-${currentTheme.value}`)

    // Update Quasar's dark mode
    if (window.Quasar && window.Quasar.Dark) {
      window.Quasar.Dark.set(isDarkMode.value)
    }
  }

  function saveThemePreference() {
    localStorage.setItem('mindlife-theme', currentTheme.value)
  }

  function loadThemePreference() {
    const savedTheme = localStorage.getItem('mindlife-theme')
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setSystemPreference()
    }
  }

  function initializeTheme() {
    loadThemePreference()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (!localStorage.getItem('mindlife-theme')) {
        setSystemPreference()
      }
    })
  }

  return {
    // State
    isDarkMode,
    systemPreference,

    // Getters
    currentTheme,
    themeColors,

    // Actions
    toggleTheme,
    setTheme,
    setSystemPreference,
    updateDocumentTheme,
    saveThemePreference,
    loadThemePreference,
    initializeTheme,
  }
})
