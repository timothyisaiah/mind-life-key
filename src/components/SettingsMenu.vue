<template>
  <q-btn-dropdown flat icon="settings" class="settings-btn">
    <q-list class="settings-menu">
      <q-item-label header class="text-weight-bold">
        <q-icon name="settings" class="q-mr-sm" />
        Settings
      </q-item-label>

      <q-separator class="q-my-sm" />

      <!-- Theme Section -->
      <q-item-label header class="text-subtitle2 text-grey-6">
        <q-icon name="palette" class="q-mr-sm" />
        Appearance
      </q-item-label>

      <q-item clickable @click="setTheme('light')" :active="!isDarkMode">
        <q-item-section avatar>
          <q-icon name="light_mode" :color="!isDarkMode ? 'primary' : 'grey-6'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Light Mode</q-item-label>
          <q-item-label caption>Clean & Professional</q-item-label>
        </q-item-section>
        <q-item-section side v-if="!isDarkMode">
          <q-icon name="check" color="primary" />
        </q-item-section>
      </q-item>

      <q-item clickable @click="setTheme('dark')" :active="isDarkMode">
        <q-item-section avatar>
          <q-icon name="dark_mode" :color="isDarkMode ? 'warning' : 'grey-6'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Dark Mode</q-item-label>
          <q-item-label caption>Modern & Sleek</q-item-label>
        </q-item-section>
        <q-item-section side v-if="isDarkMode">
          <q-icon name="check" color="warning" />
        </q-item-section>
      </q-item>

      <q-item clickable @click="setSystemPreference">
        <q-item-section avatar>
          <q-icon name="auto_mode" color="info" />
        </q-item-section>
        <q-item-section>
          <q-item-label>System Preference</q-item-label>
          <q-item-label caption>Follow OS setting</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator class="q-my-sm" />

      <!-- Currency Section -->
      <q-item-label header class="text-subtitle2 text-grey-6">
        <q-icon name="currency_exchange" class="q-mr-sm" />
        Currency
      </q-item-label>

      <q-item clickable @click="goToCurrency">
        <q-item-section avatar>
          <q-icon name="currency_exchange" color="secondary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Currency Settings</q-item-label>
          <q-item-label caption>Manage currencies & rates</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-6" />
        </q-item-section>
      </q-item>

      <q-separator class="q-my-sm" />

      <!-- Data Section -->
      <q-item-label header class="text-subtitle2 text-grey-6">
        <q-icon name="storage" class="q-mr-sm" />
        Data
      </q-item-label>

      <q-item clickable @click="exportData">
        <q-item-section avatar>
          <q-icon name="download" color="positive" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Export Data</q-item-label>
          <q-item-label caption>Download your financial data</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="showResetDialog = true">
        <q-item-section avatar>
          <q-icon name="refresh" color="warning" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Reset App</q-item-label>
          <q-item-label caption>Clear all data and start fresh</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>

  <!-- Reset Confirmation Dialog -->
  <q-dialog v-model="showResetDialog" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">Reset Application</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to reset the application? This will permanently delete all your financial data,
        transactions, goals, and settings. This action cannot be undone.
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="showResetDialog = false" />
        <q-btn color="negative" label="Reset" @click="resetApp" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from 'src/stores/theme'
import { useFinancialStore } from 'src/stores/financial'
import { useAuthStore } from 'src/stores/auth'
import { Notify } from 'quasar'

const router = useRouter()
const themeStore = useThemeStore()
const financialStore = useFinancialStore()
const authStore = useAuthStore()

const showResetDialog = ref(false)

const isDarkMode = computed(() => themeStore.isDarkMode)

function setTheme(theme) {
  themeStore.setTheme(theme)
  Notify.create({
    type: 'positive',
    message: `Switched to ${theme} mode`,
    icon: theme === 'dark' ? 'dark_mode' : 'light_mode',
    position: 'top',
    timeout: 2000
  })
}

function setSystemPreference() {
  themeStore.setSystemPreference()
  Notify.create({
    type: 'info',
    message: 'Using system theme preference',
    icon: 'auto_mode',
    position: 'top',
    timeout: 2000
  })
}

function goToCurrency() {
  router.push('/currency')
}

function exportData() {
  // TODO: Implement data export functionality
  Notify.create({
    type: 'info',
    message: 'Export functionality coming soon',
    icon: 'info',
    position: 'top',
    timeout: 2000
  })
}

function resetApp() {
  financialStore.clearAllData()
  authStore.clearAuth()
  showResetDialog.value = false
  Notify.create({
    type: 'positive',
    message: 'Application reset successfully',
    icon: 'check_circle',
    position: 'top',
    timeout: 2000
  })
  router.push('/auth')
}
</script>

<style scoped>
.settings-btn {
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.settings-menu {
  min-width: 280px;
  background-color: var(--q-surface);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.settings-menu .q-item {
  border-radius: 8px;
  margin: 2px 8px;
  transition: all 0.2s ease;
}

.settings-menu .q-item:hover {
  background-color: var(--q-hover);
}

.settings-menu .q-item.active {
  background-color: rgba(var(--q-primary), 0.1);
  border: 1px solid var(--q-primary);
}

.settings-menu .q-item-label[header] {
  padding: 8px 16px;
  margin: 8px 0 4px 0;
  font-weight: 600;
  color: var(--q-text-secondary);
}

.settings-menu .q-item-label[header].text-subtitle2 {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

/* Dark mode specific improvements */
.theme-dark .settings-menu {
  background-color: var(--q-surface);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.theme-dark .settings-menu .q-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.theme-dark .settings-menu .q-item.active {
  background-color: rgba(var(--q-primary), 0.2);
  border-color: var(--q-primary);
}

.theme-dark .settings-menu .q-item-label[header] {
  color: var(--q-text-secondary);
}
</style>
