<template>
  <q-page class="dashboard-page">
    <!-- Header Section -->
    <div class="dashboard-header q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <h4 class="text-h4 text-weight-bold q-ma-none">MindLifeKey</h4>
          <p class="text-subtitle1 text-theme-secondary q-ma-none">Your Financial Dashboard</p>
        </div>
        <div class="text-right">
          <div class="text-h5 text-weight-bold" :class="netWorth >= 0 ? 'text-profit' : 'text-loss'">
            {{ formatCurrency(netWorth) }}
          </div>
          <div class="text-caption text-theme-secondary">
            Net Worth
            <q-icon v-if="isRefreshing" name="refresh" size="sm" class="text-white animate-spin q-ml-xs" />
            <span v-else class="text-white q-ml-xs">• Live</span>
          </div>
          <div class="q-mt-sm">
            <q-btn flat dense size="sm" :icon="showThemeShowcase ? 'visibility_off' : 'palette'"
              :label="showThemeShowcase ? 'Hide Theme' : 'Show Theme'" @click="showThemeShowcase = !showThemeShowcase"
              color="accent" />
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Section -->
    <div class="q-pa-md" v-if="overdueBills.length > 0 || upcomingBills.length > 0">
      <div class="row q-col-gutter-md">
        <!-- Overdue Bills Alert -->
        <div class="col-12 col-sm-6" v-if="overdueBills.length > 0">
          <q-card class="notification-card overdue">
            <q-card-section>
              <div class="text-h6 text-negative q-mb-md">
                <q-icon name="warning" class="q-mr-sm" />
                Overdue Bills ({{ overdueBills.length }})
              </div>
              <q-list dense>
                <q-item v-for="bill in overdueBills.slice(0, 3)" :key="bill.id" class="q-px-none">
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ bill.description }}</q-item-label>
                    <q-item-label caption>
                      Due: {{ formatDate(bill.nextDue) }} • {{ bill.frequency }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-negative text-weight-bold">
                      {{ formatCurrency(bill.amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div class="text-center q-mt-md">
                <q-btn flat color="negative" label="View All" :to="{ name: 'recurring' }" icon="arrow_forward" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Upcoming Bills Alert -->
        <div class="col-12 col-sm-6" v-if="upcomingBills.length > 0">
          <q-card class="notification-card upcoming">
            <q-card-section>
              <div class="text-h6 text-warning q-mb-md">
                <q-icon name="schedule" class="q-mr-sm" />
                Upcoming Bills ({{ upcomingBills.length }})
              </div>
              <q-list dense>
                <q-item v-for="bill in upcomingBills.slice(0, 3)" :key="bill.id" class="q-px-none">
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ bill.description }}</q-item-label>
                    <q-item-label caption>
                      Due: {{ formatDate(bill.nextDue) }} • {{ bill.frequency }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-negative text-weight-bold">
                      {{ formatCurrency(bill.amount) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div class="text-center q-mt-md">
                <q-btn flat color="warning" label="View All" :to="{ name: 'recurring' }" icon="arrow_forward" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="row q-col-gutter-md q-pa-md">
      <div class="col-12 col-sm-4">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="trending_up" size="2rem" color="positive" class="q-mb-sm" />
            <div class="text-h6 text-weight-bold text-profit">{{ formatCurrency(monthlyIncome) }}</div>
            <div class="text-caption text-theme-secondary">Monthly Income</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-4">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="trending_down" size="2rem" color="negative" class="q-mb-sm" />
            <div class="text-h6 text-weight-bold text-loss">{{ formatCurrency(monthlyExpenses) }}</div>
            <div class="text-caption text-theme-secondary">Monthly Expenses</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-4">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-icon name="account_balance" size="2rem" color="primary" class="q-mb-sm" />
            <div class="text-h6 text-weight-bold"
              :class="(monthlyIncome - monthlyExpenses) >= 0 ? 'text-profit' : 'text-loss'">
              {{ formatCurrency(monthlyIncome - monthlyExpenses) }}
            </div>
            <div class="text-caption text-theme-secondary">Monthly Balance</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row q-col-gutter-md q-pa-md">
      <div class="col-12 col-md-6">
        <ExpenseChart :key="`expense-${refreshKey}`" :expenses="expensesByCategory" />
      </div>
      <div class="col-12 col-md-6">
        <BalanceChart :key="`balance-${refreshKey}`" :transactions="transactions"
          :starting-balance="userSettings.startingBalance" />
      </div>
    </div>

    <!-- Theme Showcase Section (only show in development or when explicitly enabled) -->
    <div class="q-pa-md" v-if="showThemeShowcase">
      <ThemeShowcase />
    </div>

    <!-- Cash Flow Forecast Preview -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="row q-col-gutter-md items-center justify-between q-mb-md">
            <div class="text-h6">6-Month Cash Flow Forecast</div>
            <q-btn flat color="primary" label="View Full Forecast" :to="{ name: 'forecaster' }" icon="arrow_forward" />
          </div>
          <div v-if="forecastPreview.length === 0" class="text-center text-theme-secondary q-py-lg">
            <q-icon name="trending_up" size="3rem" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">No forecast data available</div>
            <div class="text-body2">Set up recurring transactions to see cash flow projections</div>
          </div>
          <div v-else>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3" v-for="month in forecastPreview" :key="month.month">
                <q-card flat bordered>
                  <q-card-section class="text-center">
                    <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ month.monthName }}</div>
                    <div class="text-h6" :class="month.endingBalance >= 0 ? 'text-profit' : 'text-loss'">
                      {{ formatCurrency(month.endingBalance) }}
                    </div>
                    <div class="text-caption text-theme-secondary">
                      Net: {{ formatCurrency(month.netCashFlow) }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Recent Transactions -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Recent Transactions</div>
          <div v-if="recentTransactions.length === 0" class="text-center text-theme-secondary q-py-lg">
            <q-icon name="receipt_long" size="3rem" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">No transactions yet</div>
            <div class="text-body2 q-mb-md">Get started by adding your first transaction or load demo data to explore
              the app</div>
            <div class="row q-col-gutter-md justify-center">
              <q-btn color="primary" label="Add Transaction" :to="{ name: 'transactions' }" icon="add" />
              <q-btn color="secondary" label="Load Demo Data" @click="loadDemoDataHandler" icon="play_arrow" />
            </div>
          </div>
          <div v-else>
            <q-list>
              <q-item v-for="transaction in recentTransactions" :key="transaction.id" class="q-px-none">
                <q-item-section avatar>
                  <q-icon :name="transaction.type === 'income' ? 'add_circle' : 'remove_circle'"
                    :color="transaction.type === 'income' ? 'positive' : 'negative'" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ transaction.description }}</q-item-label>
                  <q-item-label caption>
                    {{ getCategoryName(transaction.categoryId) }} • {{ formatDateShort(transaction.date) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label :class="transaction.type === 'income' ? 'text-positive' : 'text-negative'"
                    class="text-weight-bold">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div class="text-center q-mt-md">
              <q-btn flat color="primary" label="View All Transactions" :to="{ name: 'transactions' }"
                icon="arrow_forward" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Goals Overview -->
    <div class="q-pa-md" v-if="goals.length > 0">
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Savings Goals</div>
          <div class="row q-col-gutter-md">
            <div v-for="goal in activeGoals" :key="goal.id" class="col-6 col-md-4 col-lg-3 col-sm-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 text-weight-bold">{{ goal.name }}</div>
                  <div class="text-caption text-theme-secondary q-mb-sm">
                    Target: {{ formatCurrency(goal.targetAmount) }} by {{ formatDate(goal.targetDate) }}
                  </div>
                  <q-linear-progress :value="goal.currentAmount / goal.targetAmount" color="primary" size="20px"
                    rounded />
                  <div class="text-caption q-mt-sm">
                    {{ formatCurrency(goal.currentAmount) }} / {{ formatCurrency(goal.targetAmount) }}
                    ({{ Math.round((goal.currentAmount / goal.targetAmount) * 100) }}%)
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <div class="text-center q-mt-md">
            <div class="row q-col-gutter-md justify-center">
              <q-btn flat color="primary" label="Manage Goals" :to="{ name: 'goals' }" icon="flag" />
              <q-btn flat color="orange" label="Enhanced Goals" :to="{ name: 'enhanced-goals' }" icon="emoji_events" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Achievements Widget -->
    <div class="q-pa-md" v-if="userAchievements.length > 0">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Recent Achievements</div>
            <q-btn flat color="orange" label="View All" :to="{ name: 'enhanced-goals' }" icon="arrow_forward" />
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4" v-for="achievement in recentAchievements" :key="achievement.id">
              <q-card flat bordered class="achievement-widget">
                <q-card-section class="text-center">
                  <q-icon :name="achievement.icon" size="2rem" color="orange" class="q-mb-sm" />
                  <div class="text-subtitle2 text-weight-bold q-mb-xs">{{ achievement.title }}</div>
                  <div class="text-caption text-theme-secondary">{{ achievement.description }}</div>
                  <div class="text-caption text-theme-secondary q-mt-xs">
                    {{ formatDate(achievement.earnedAt) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Smart Notifications Widget -->
    <div class="q-pa-md" v-if="highPriorityNotifications.length > 0">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Important Notifications</div>
            <q-btn flat color="indigo" label="View All" :to="{ name: 'notifications' }" icon="arrow_forward" />
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12" v-for="notification in highPriorityNotifications.slice(0, 3)" :key="notification.id">
              <q-banner :class="`bg-${notification.color}-1 text-${notification.color}`" rounded
                class="notification-banner">
                <template v-slot:avatar>
                  <q-icon :name="notification.icon" :color="notification.color" />
                </template>
                <div class="text-subtitle2 text-weight-bold">{{ notification.title }}</div>
                <div class="text-body2">{{ notification.message }}</div>
                <template v-slot:action>
                  <q-btn flat :color="notification.color" label="View" @click="$router.push(notification.action.route)"
                    size="sm" />
                </template>
              </q-banner>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Financial Trends Widget -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Financial Trends</div>
            <q-btn flat color="teal" label="View Full Report" :to="{ name: 'advanced-reports' }" icon="arrow_forward" />
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered class="trend-widget">
                <q-card-section class="text-center">
                  <q-icon name="trending_up" size="2rem"
                    :color="trendAnalysis.income.trend >= 0 ? 'positive' : 'negative'" class="q-mb-sm" />
                  <div class="text-h6 text-weight-bold">Income</div>
                  <div class="text-subtitle2"
                    :class="trendAnalysis.income.trend >= 0 ? 'text-positive' : 'text-negative'">
                    {{ trendAnalysis.income.trend >= 0 ? '+' : '' }}{{ trendAnalysis.income.trend.toFixed(1) }}%
                  </div>
                  <div class="text-caption text-theme-secondary">vs last month</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="trend-widget">
                <q-card-section class="text-center">
                  <q-icon name="trending_down" size="2rem"
                    :color="trendAnalysis.expenses.trend <= 0 ? 'positive' : 'negative'" class="q-mb-sm" />
                  <div class="text-h6 text-weight-bold">Expenses</div>
                  <div class="text-subtitle2"
                    :class="trendAnalysis.expenses.trend <= 0 ? 'text-positive' : 'text-negative'">
                    {{ trendAnalysis.expenses.trend >= 0 ? '+' : '' }}{{ trendAnalysis.expenses.trend.toFixed(1) }}%
                  </div>
                  <div class="text-caption text-theme-secondary">vs last month</div>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered class="trend-widget">
                <q-card-section class="text-center">
                  <q-icon name="account_balance" size="2rem"
                    :color="trendAnalysis.netWorth.trend >= 0 ? 'positive' : 'negative'" class="q-mb-sm" />
                  <div class="text-h6 text-weight-bold">Net Worth</div>
                  <div class="text-subtitle2"
                    :class="trendAnalysis.netWorth.trend >= 0 ? 'text-positive' : 'text-negative'">
                    {{ trendAnalysis.netWorth.trend >= 0 ? '+' : '' }}{{ trendAnalysis.netWorth.trend.toFixed(1) }}%
                  </div>
                  <div class="text-caption text-theme-secondary">vs last month</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Floating Action Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-fab v-model="fabExpanded" vertical-actions-align="right" color="primary" icon="add" direction="up"
        :hide-icon="false">
        <q-fab-action color="negative" icon="remove" label="Add Expense" @click="showAddTransactionDialog('expense')" />
        <q-fab-action color="positive" icon="add" label="Add Income" @click="showAddTransactionDialog('income')" />
        <q-fab-action color="secondary" icon="flag" label="New Goal" @click="showAddGoalDialog" />
        <q-fab-action color="info" icon="assessment" label="Reports" @click="$router.push({ name: 'reports' })" />
        <q-fab-action color="accent" icon="repeat" label="Recurring" @click="$router.push({ name: 'recurring' })" />
        <q-fab-action color="purple" icon="trending_up" label="Forecaster"
          @click="$router.push({ name: 'forecaster' })" />
        <q-fab-action color="orange" icon="emoji_events" label="Enhanced Goals"
          @click="$router.push({ name: 'enhanced-goals' })" />
        <q-fab-action color="teal" icon="analytics" label="Advanced Reports"
          @click="$router.push({ name: 'advanced-reports' })" />
        <q-fab-action color="indigo" icon="notifications" label="Notifications"
          @click="$router.push({ name: 'notifications' })">
          <q-badge v-if="unreadNotificationsCount > 0" color="negative" floating>
            {{ unreadNotificationsCount }}
          </q-badge>
        </q-fab-action>
      </q-fab>
    </q-page-sticky>

    <!-- Add Transaction Dialog -->
    <q-dialog v-model="showTransactionDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ transactionDialogType === 'income' ? 'Add Income' : 'Add Expense' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="addTransaction" class="q-col-gutter-md">
            <q-input v-model="newTransaction.description" label="Description" outlined
              :rules="[val => !!val || 'Description is required']" />
            <q-input v-model.number="newTransaction.amount" label="Amount" type="number" step="0.01" outlined
              :rules="[val => val > 0 || 'Amount must be greater than 0']" />
            <q-select v-model="newTransaction.categoryId" :options="categoryOptions" label="Category" outlined
              emit-value map-options :rules="[val => !!val || 'Category is required']" />
            <q-input v-model="newTransaction.date" label="Date" type="date" outlined />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeTransactionDialog" />
          <q-btn color="primary" label="Add" @click="addTransaction" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Goal Dialog -->
    <q-dialog v-model="showGoalDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create New Goal</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="addGoal" class="q-col-gutter-md">
            <q-input v-model="newGoal.name" label="Goal Name" outlined
              :rules="[val => !!val || 'Goal name is required']" />
            <q-input v-model.number="newGoal.targetAmount" label="Target Amount" type="number" step="0.01" outlined
              :rules="[val => val > 0 || 'Target amount must be greater than 0']" />
            <q-input v-model="newGoal.targetDate" label="Target Date" type="date" outlined
              :rules="[val => !!val || 'Target date is required']" />
            <q-input v-model="newGoal.description" label="Description (optional)" outlined type="textarea" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeGoalDialog" />
          <q-btn color="primary" label="Create" @click="addGoal" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { formatCurrency, formatDate, formatDateShort } from 'src/utils/formatters'
import { loadDemoData } from 'src/utils/demoData'
import ExpenseChart from 'src/components/charts/ExpenseChart.vue'
import BalanceChart from 'src/components/charts/BalanceChart.vue'
import ThemeShowcase from 'src/components/ThemeShowcase.vue'

const financialStore = useFinancialStore()

// Computed properties
const {
  transactions,
  goals,
  categories,
  userSettings,
  netWorth,
  monthlyIncome,
  monthlyExpenses,
  expensesByCategory,
  upcomingBills,
  overdueBills
} = financialStore

const recentTransactions = computed(() => {
  return [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
})

const activeGoals = computed(() => {
  return goals.filter(goal => {
    const targetDate = new Date(goal.targetDate)
    const today = new Date()
    return targetDate > today && goal.currentAmount < goal.targetAmount
  }).slice(0, 4)
})

const forecastPreview = computed(() => {
  return financialStore.generateCashFlowProjection(6).slice(0, 6)
})

const userAchievements = computed(() => financialStore.userAchievements)

const sortedAchievements = computed(() => {
  return [...userAchievements.value].sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
})

const recentAchievements = computed(() => {
  return sortedAchievements.value.slice(0, 3)
})

const trendAnalysis = computed(() => financialStore.generateTrendAnalysis())

const unreadNotificationsCount = computed(() => financialStore.getUnreadNotificationsCount())

const highPriorityNotifications = computed(() => financialStore.getHighPriorityNotifications())

const categoryOptions = computed(() => {
  return categories
    .filter(cat => cat.type === (transactionDialogType.value === 'income' ? 'income' : 'expense'))
    .map(cat => ({
      label: cat.name,
      value: cat.id
    }))
})

// Dialog state
const showTransactionDialog = ref(false)
const showGoalDialog = ref(false)
const transactionDialogType = ref('expense')
const fabExpanded = ref(false)

// Live dashboard state
const isRefreshing = ref(false)
const lastUpdateTime = ref(new Date())
const refreshKey = ref(0) // Force component re-renders
const showThemeShowcase = ref(false) // Set to true to show theme showcase

// Form data
const newTransaction = ref({
  description: '',
  amount: 0,
  categoryId: null,
  date: new Date().toISOString().split('T')[0],
  type: 'expense'
})

const newGoal = ref({
  name: '',
  targetAmount: 0,
  targetDate: '',
  description: ''
})

// Methods
const getCategoryName = (categoryId) => {
  const category = categories.find(cat => cat.id === categoryId)
  return category ? category.name : 'Unknown'
}

const showAddTransactionDialog = (type) => {
  transactionDialogType.value = type
  newTransaction.value = {
    description: '',
    amount: 0,
    categoryId: null,
    date: new Date().toISOString().split('T')[0],
    type: type
  }
  showTransactionDialog.value = true
}

const closeTransactionDialog = () => {
  showTransactionDialog.value = false
  newTransaction.value = {
    description: '',
    amount: 0,
    categoryId: null,
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  }
}

const addTransaction = () => {
  if (newTransaction.value.description && newTransaction.value.amount > 0 && newTransaction.value.categoryId) {
    financialStore.addTransaction(newTransaction.value)
    closeTransactionDialog()
    // Dashboard will auto-refresh via watchers
  }
}

const showAddGoalDialog = () => {
  newGoal.value = {
    name: '',
    targetAmount: 0,
    targetDate: '',
    description: ''
  }
  showGoalDialog.value = true
}

const closeGoalDialog = () => {
  showGoalDialog.value = false
}

const addGoal = () => {
  if (newGoal.value.name && newGoal.value.targetAmount > 0 && newGoal.value.targetDate) {
    financialStore.addGoal(newGoal.value)
    closeGoalDialog()
    // Dashboard will auto-refresh via watchers
  }
}

const loadDemoDataHandler = () => {
  loadDemoData(financialStore)
  triggerDashboardRefresh()
}

// Live dashboard methods
const triggerDashboardRefresh = async () => {
  isRefreshing.value = true
  lastUpdateTime.value = new Date()
  refreshKey.value++

  // Force re-computation of all data
  await nextTick()

  // Process any pending operations
  financialStore.processRecurringTransactions()
  financialStore.generateSmartNotifications()

  // Small delay to show refresh indicator
  setTimeout(() => {
    isRefreshing.value = false
  }, 500)
}

// Watch for changes in financial data
watch(() => financialStore.transactions, () => {
  triggerDashboardRefresh()
}, { deep: true })

watch(() => financialStore.goals, () => {
  triggerDashboardRefresh()
}, { deep: true })

watch(() => financialStore.recurringTransactions, () => {
  triggerDashboardRefresh()
}, { deep: true })

watch(() => financialStore.userSettings, () => {
  triggerDashboardRefresh()
}, { deep: true })

// Watch for changes in categories
watch(() => financialStore.categories, () => {
  triggerDashboardRefresh()
}, { deep: true })

// Auto-refresh every 30 seconds
let autoRefreshInterval = null

const startAutoRefresh = () => {
  autoRefreshInterval = setInterval(() => {
    if (!isRefreshing.value) {
      triggerDashboardRefresh()
    }
  }, 30000) // 30 seconds
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
}

onMounted(() => {
  // Load data from localStorage
  financialStore.loadFromLocalStorage()
  // Process recurring transactions
  financialStore.processRecurringTransactions()
  // Generate smart notifications
  financialStore.generateSmartNotifications()
  // Start auto-refresh
  startAutoRefresh()
})

// Cleanup on unmount
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.dashboard-page {
  background-color: var(--q-background);
  min-height: 100vh;
  color: var(--q-text-primary);
}

.dashboard-header {
  background: var(--q-primary);
  color: white;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--q-shadow);
  background-color: var(--q-surface);
  color: var(--q-text-primary);
}

.notification-card {
  border-left: 4px solid;
}

.notification-card.overdue {
  border-left-color: var(--q-loss);
}

.notification-card.upcoming {
  border-left-color: var(--q-warning);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
