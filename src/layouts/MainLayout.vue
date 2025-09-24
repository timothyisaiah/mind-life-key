<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="theme-navigation">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="text-weight-bold">
          <q-icon name="account_balance" class="q-mr-sm" />
          MindLifeKey
        </q-toolbar-title>

        <div class="row items-center q-gutter-sm">
          <ThemeToggle />
          <q-btn flat round icon="notifications" :to="{ name: 'notifications' }">
            <q-badge v-if="unreadNotificationsCount > 0" color="negative" floating>
              {{ unreadNotificationsCount }}
            </q-badge>
          </q-btn>
          <q-btn flat round icon="settings" />
          <q-btn flat round icon="logout" @click="logout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-theme-surface">
      <q-list>
        <q-item-label header class="text-theme-secondary">
          <q-icon name="dashboard" class="q-mr-sm" />
          Navigation
        </q-item-label>

        <q-item v-for="link in navigationLinks" :key="link.title" clickable v-ripple :to="link.route"
          class="navigation-item" :class="{ 'active': $route.name === link.routeName }">
          <q-item-section avatar>
            <q-icon :name="link.icon" :color="$route.name === link.routeName ? 'primary' : 'grey-6'" />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ link.title }}</q-item-label>
            <q-item-label caption>{{ link.caption }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" />

        <q-item-label header class="text-theme-secondary">
          <q-icon name="assessment" class="q-mr-sm" />
          Quick Stats
        </q-item-label>

        <q-item>
          <q-item-section>
            <q-item-label class="text-weight-bold text-profit">
              {{ formatCurrency(monthlyIncome) }}
            </q-item-label>
            <q-item-label caption>Monthly Income</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section>
            <q-item-label class="text-weight-bold text-loss">
              {{ formatCurrency(monthlyExpenses) }}
            </q-item-label>
            <q-item-label caption>Monthly Expenses</q-item-label>
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section>
            <q-item-label class="text-weight-bold"
              :class="(monthlyIncome - monthlyExpenses) >= 0 ? 'text-profit' : 'text-loss'">
              {{ formatCurrency(monthlyIncome - monthlyExpenses) }}
            </q-item-label>
            <q-item-label caption>Monthly Balance</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { useAuthStore } from 'src/stores/auth'
import { useThemeStore } from 'src/stores/theme'
import { formatCurrency } from 'src/utils/formatters'
import ThemeToggle from 'src/components/ThemeToggle.vue'

const financialStore = useFinancialStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const navigationLinks = [
  {
    title: 'Dashboard',
    caption: 'Overview & insights',
    icon: 'dashboard',
    route: '/',
    routeName: 'dashboard'
  },
  {
    title: 'Transactions',
    caption: 'Income & expenses',
    icon: 'receipt_long',
    route: '/transactions',
    routeName: 'transactions'
  },
  {
    title: 'Goals',
    caption: 'Savings targets',
    icon: 'flag',
    route: '/goals',
    routeName: 'goals'
  },
  {
    title: 'Reports',
    caption: 'Analytics & export',
    icon: 'assessment',
    route: '/reports',
    routeName: 'reports'
  },
  {
    title: 'Recurring',
    caption: 'Automated transactions',
    icon: 'repeat',
    route: '/recurring',
    routeName: 'recurring'
  },
  {
    title: 'Forecaster',
    caption: 'Cash flow projections',
    icon: 'trending_up',
    route: '/forecaster',
    routeName: 'forecaster'
  },
  {
    title: 'Enhanced Goals',
    caption: 'Gamified savings',
    icon: 'emoji_events',
    route: '/enhanced-goals',
    routeName: 'enhanced-goals'
  },
  {
    title: 'Advanced Reports',
    caption: 'Financial insights',
    icon: 'analytics',
    route: '/advanced-reports',
    routeName: 'advanced-reports'
  },
  {
    title: 'Notifications',
    caption: 'Smart reminders',
    icon: 'notifications',
    route: '/notifications',
    routeName: 'notifications'
  },
  {
    title: 'Currency',
    caption: 'Multi-currency support',
    icon: 'currency_exchange',
    route: '/currency',
    routeName: 'currency'
  }
]

const { monthlyIncome, monthlyExpenses } = financialStore

const unreadNotificationsCount = computed(() => financialStore.getUnreadNotificationsCount())

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function logout() {
  authStore.logout()
}

// Initialize theme on component mount
onMounted(() => {
  themeStore.initializeTheme()
})
</script>

<style scoped>
.navigation-item {
  transition: background-color 0.2s;
}

.navigation-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.navigation-item.active {
  background-color: rgba(25, 118, 210, 0.12);
  border-right: 3px solid #1976d2;
}
</style>
