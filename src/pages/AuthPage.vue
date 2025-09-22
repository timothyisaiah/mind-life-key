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

                            <!-- PIN Setup Form -->
                            <div v-if="!hasPin" class="pin-setup">
                                <div class="text-h6 q-mb-md">Set up your PIN</div>
                                <p class="text-body2 text-grey-6 q-mb-lg">
                                    Create a 4-digit PIN to secure your financial data
                                </p>

                                <q-form @submit="setupPin" class="q-gutter-md">
                                    <q-input v-model="newPin" label="Enter PIN" type="password" outlined maxlength="4"
                                        :rules="[val => val.length === 4 || 'PIN must be 4 digits']"
                                        class="pin-input" />
                                    <q-input v-model="confirmPin" label="Confirm PIN" type="password" outlined
                                        maxlength="4" :rules="[val => val === newPin || 'PINs do not match']"
                                        class="pin-input" />
                                    <q-btn type="submit" color="primary" label="Set PIN" class="full-width q-mt-md"
                                        :disable="newPin.length !== 4 || confirmPin !== newPin" />
                                </q-form>
                            </div>

                            <!-- PIN Login Form -->
                            <div v-else class="pin-login">
                                <div class="text-h6 q-mb-md">Enter your PIN</div>
                                <p class="text-body2 text-grey-6 q-mb-lg">
                                    Enter your 4-digit PIN to access your financial data
                                </p>

                                <q-form @submit="login" class="q-gutter-md">
                                    <q-input v-model="loginPin" label="PIN" type="password" outlined maxlength="4"
                                        :rules="[val => val.length === 4 || 'PIN must be 4 digits']" class="pin-input"
                                        @keyup.enter="login" />
                                    <q-btn type="submit" color="primary" label="Login" class="full-width q-mt-md"
                                        :disable="loginPin.length !== 4" />
                                </q-form>

                                <div class="q-mt-md">
                                    <q-btn flat color="grey-6" label="Forgot PIN? Reset App" @click="confirmReset"
                                        size="sm" />
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <!-- Reset Confirmation Dialog -->
                <q-dialog v-model="showResetDialog" persistent>
                    <q-card>
                        <q-card-section>
                            <div class="text-h6">Reset App</div>
                        </q-card-section>
                        <q-card-section>
                            This will delete all your financial data and reset the app. Are you sure?
                        </q-card-section>
                        <q-card-actions align="right">
                            <q-btn flat label="Cancel" @click="showResetDialog = false" />
                            <q-btn color="negative" label="Reset" @click="resetApp" />
                        </q-card-actions>
                    </q-card>
                </q-dialog>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useFinancialStore } from 'src/stores/financial'

const router = useRouter()
const authStore = useAuthStore()
const financialStore = useFinancialStore()

// State
const newPin = ref('')
const confirmPin = ref('')
const loginPin = ref('')
const showResetDialog = ref(false)

// Computed
const hasPin = computed(() => authStore.hasPin)

// Methods
const setupPin = () => {
    if (newPin.value.length === 4 && newPin.value === confirmPin.value) {
        authStore.setPin(newPin.value)
        authStore.authenticate(newPin.value)
        router.push('/')
    }
}

const login = () => {
    if (loginPin.value.length === 4) {
        if (authStore.authenticate(loginPin.value)) {
            router.push('/')
        } else {
            // Show error message
            console.log('Invalid PIN')
        }
    }
}

const confirmReset = () => {
    showResetDialog.value = true
}

const resetApp = () => {
    authStore.clearAuth()
    financialStore.clearAllData()
    showResetDialog.value = false
    // Reset form
    newPin.value = ''
    confirmPin.value = ''
    loginPin.value = ''
    // Force reload to reset state
    window.location.reload()
}

onMounted(() => {
    // Check if user is already authenticated
    if (authStore.isAuthenticated) {
        router.push('/')
    }
})
</script>

<style scoped>
.auth-layout {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
