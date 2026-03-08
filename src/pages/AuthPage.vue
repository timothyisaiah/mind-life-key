<template>
  <q-layout view="hHh lpR fFf" class="auth-layout">
    <q-page-container>
      <q-page class="auth-page flex flex-center">
        <div class="auth-container">
          <q-card class="auth-card">
            <q-card-section class="text-center q-pa-xl">
              <div class="auth-header q-mb-lg">
                <q-icon name="account_balance" size="4rem" color="primary" class="q-mb-md" />
                <h4 class="text-h4 text-weight-bold q-ma-none">MindLifeKey</h4>
                <p class="text-subtitle1 text-grey-6 q-ma-none">Your Personal Finance Manager</p>
              </div>

              <div class="q-mb-md">
                <q-btn-toggle v-model="mode" dense unelevated toggle-color="primary" color="grey-3" text-color="grey-8"
                  :options="[
                    { label: 'Login', value: 'login' },
                    { label: 'Create Account', value: 'register' },
                  ]" />
              </div>

              <q-form @submit="submitAuth" class="q-gutter-md">
                <q-input v-model="email" label="Email" type="email" outlined autocomplete="email"
                  :rules="[val => !!val || 'Email is required']" />
                <q-input v-model="password" label="Password" type="password" outlined autocomplete="current-password"
                  :rules="[val => (val && val.length >= 6) || 'Use at least 6 characters']" />
                <q-input v-if="mode === 'register'" v-model="confirmPassword" label="Confirm Password" type="password"
                  outlined autocomplete="new-password" :rules="[val => val === password || 'Passwords do not match']" />
                <q-btn type="submit" color="primary" class="full-width q-mt-md"
                  :label="mode === 'login' ? 'Login' : 'Create Account'" :loading="submitting" />
              </q-form>

              <div class="q-mt-lg">
                <q-separator spaced />
                <q-btn outline color="primary" icon="google" label="Continue with Google" class="full-width q-mt-md"
                  @click="loginWithGoogle" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useFinancialStore } from 'src/stores/financial'

const router = useRouter()
const authStore = useAuthStore()
const financialStore = useFinancialStore()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const mode = ref('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const submitAuth = async () => {
  if (submitting.value) return
  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    Notify.create({ type: 'negative', message: 'Passwords do not match.' })
    return
  }

  submitting.value = true
  try {
    if (mode.value === 'register') {
      await authStore.register(email.value, password.value)
    } else {
      await authStore.login(email.value, password.value)
    }
    await financialStore.initializeFromApi()
    router.push('/')
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error?.message || 'Authentication failed.',
    })
  } finally {
    submitting.value = false
  }
}

const loginWithGoogle = () => {
  const base = API_BASE_URL.replace(/\/$/, '')
  const redirectUrl = base ? `${base}/api/auth/google` : '/api/auth/google'
  window.location.href = redirectUrl
}

const handleAuthCallback = async () => {
  const url = new URL(window.location.href)
  const params = url.searchParams
  const token =
    params.get('accessToken') ||
    params.get('access_token') ||
    params.get('token') ||
    null
  const returnedEmail = params.get('email')
  const error = params.get('error')

  if (error) {
    Notify.create({
      type: 'negative',
      message: decodeURIComponent(error),
    })
    url.search = ''
    window.history.replaceState({}, '', url.toString())
    return
  }

  if (token) {
    authStore.acceptToken(token, returnedEmail)
    await financialStore.initializeFromApi()
    url.search = ''
    window.history.replaceState({}, '', url.toString())
    router.push('/')
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
    return
  }
  void handleAuthCallback()
})
</script>

<style scoped>
.auth-layout {
  background: var(--q-primary);
  min-height: 100vh;
}

.auth-page {
  min-height: 100vh;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.auth-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.auth-header {
  margin-bottom: 2rem;
}

.pin-input {
  font-size: 1.2rem;
  text-align: center;
}

.pin-input :deep(.q-field__control) {
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
}
</style>
