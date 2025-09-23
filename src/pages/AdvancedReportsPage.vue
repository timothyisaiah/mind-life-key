<template>
  <q-page class="advanced-reports-page">
    <!-- Pull to Refresh -->
    <q-pull-to-refresh @refresh="onRefresh">
      <!-- Header -->
      <div class="page-header q-pa-md">
        <div class="row items-center justify-between">
          <div>
            <h4 class="text-h4 text-weight-bold q-ma-none">Advanced Reports</h4>
            <p class="text-subtitle1 text-grey-6 q-ma-none">
              Comprehensive financial insights and analytics
              <q-icon v-if="isRefreshing" name="refresh" size="sm" class="text-white animate-spin q-ml-xs" />
              <span v-else class="text-white q-ml-xs">• Live</span>
            </p>
          </div>
          <div class="row q-gutter-sm">
            <q-btn color="primary" icon="download" label="Export PDF" @click="exportToPDF" />
            <q-btn color="secondary" icon="file_download" label="Export CSV" @click="exportToCSV" />
          </div>
        </div>
      </div>

      <!-- Report Controls -->
      <div class="q-pa-md">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Report Settings</div>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-3">
                <q-select v-model="reportSettings.period" :options="periodOptions" label="Report Period" outlined
                  emit-value map-options @update:model-value="refreshReports" />
              </div>
              <div class="col-12 col-md-3">
                <q-select v-model="reportSettings.year" :options="yearOptions" label="Year" outlined emit-value
                  map-options @update:model-value="refreshReports" />
              </div>
              <div class="col-12 col-md-3">
                <q-select v-model="reportSettings.month" :options="monthOptions" label="Month" outlined emit-value
                  map-options @update:model-value="refreshReports" v-if="reportSettings.period === 'monthly'" />
              </div>
              <div class="col-12 col-md-3">
                <q-btn color="primary" label="Refresh Reports" @click="refreshReports" class="full-width" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Trend Analysis Cards -->
      <div class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card class="trend-card">
              <q-card-section>
                <div class="row items-center">
                  <q-icon name="trending_up" size="2rem"
                    :color="trendAnalysis.income.trend >= 0 ? 'positive' : 'negative'" class="q-mr-md" />
                  <div class="col">
                    <div class="text-h6 text-weight-bold">Income Trend</div>
                    <div class="text-h4" :class="trendAnalysis.income.trend >= 0 ? 'text-positive' : 'text-negative'">
                      {{ formatCurrency(trendAnalysis.income.current) }}
                    </div>
                    <div class="text-caption"
                      :class="trendAnalysis.income.trend >= 0 ? 'text-positive' : 'text-negative'">
                      {{ trendAnalysis.income.trend >= 0 ? '+' : '' }}{{
                        trendAnalysis.income.trend.toFixed(1) }}% vs last month
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card class="trend-card">
              <q-card-section>
                <div class="row items-center">
                  <q-icon name="trending_down" size="2rem"
                    :color="trendAnalysis.expenses.trend <= 0 ? 'positive' : 'negative'" class="q-mr-md" />
                  <div class="col">
                    <div class="text-h6 text-weight-bold">Expense Trend</div>
                    <div class="text-h4" :class="trendAnalysis.expenses.trend <= 0 ? 'text-positive' : 'text-negative'">
                      {{ formatCurrency(trendAnalysis.expenses.current) }}
                    </div>
                    <div class="text-caption"
                      :class="trendAnalysis.expenses.trend <= 0 ? 'text-positive' : 'text-negative'">
                      {{ trendAnalysis.expenses.trend >= 0 ? '+' : '' }}{{
                        trendAnalysis.expenses.trend.toFixed(1) }}% vs last month
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card class="trend-card">
              <q-card-section>
                <div class="row items-center">
                  <q-icon name="account_balance" size="2rem"
                    :color="trendAnalysis.netWorth.trend >= 0 ? 'positive' : 'negative'" class="q-mr-md" />
                  <div class="col">
                    <div class="text-h6 text-weight-bold">Net Worth Trend</div>
                    <div class="text-h4" :class="trendAnalysis.netWorth.trend >= 0 ? 'text-positive' : 'text-negative'">
                      {{ formatCurrency(trendAnalysis.netWorth.current) }}
                    </div>
                    <div class="text-caption"
                      :class="trendAnalysis.netWorth.trend >= 0 ? 'text-positive' : 'text-negative'">
                      {{ trendAnalysis.netWorth.trend >= 0 ? '+' : '' }}{{
                        trendAnalysis.netWorth.trend.toFixed(1) }}% vs last month
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="q-pa-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-lg-8">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">Net Worth History (12 Months)</div>
                <div class="chart-container">
                  <LineChart :data="netWorthChartData" :options="netWorthChartOptions" />
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-lg-4">
            <q-card>
              <q-card-section>
                <div class="text-h6 q-mb-md">Expense Categories (6 Months)</div>
                <div class="chart-container">
                  <DoughnutChart :data="categoryChartData" :options="categoryChartOptions" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Monthly Comparison -->
      <div class="q-pa-md" v-if="reportSettings.period === 'monthly'">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Monthly Comparison</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle1 q-mb-md">Current Month ({{ currentMonthReport.monthName
                    }})</div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <div class="text-center">
                          <div class="text-h6 text-positive">{{
                            formatCurrency(currentMonthReport.income) }}</div>
                          <div class="text-caption text-grey-6">Income</div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="text-center">
                          <div class="text-h6 text-negative">{{
                            formatCurrency(currentMonthReport.expenses) }}</div>
                          <div class="text-caption text-grey-6">Expenses</div>
                        </div>
                      </div>
                    </div>
                    <q-separator class="q-my-md" />
                    <div class="text-center">
                      <div class="text-h5"
                        :class="currentMonthReport.netIncome >= 0 ? 'text-positive' : 'text-negative'">
                        {{ formatCurrency(currentMonthReport.netIncome) }}
                      </div>
                      <div class="text-caption text-grey-6">Net Income</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle1 q-mb-md">Previous Month ({{ previousMonthReport.monthName
                    }})</div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <div class="text-center">
                          <div class="text-h6 text-positive">{{
                            formatCurrency(previousMonthReport.income) }}</div>
                          <div class="text-caption text-grey-6">Income</div>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="text-center">
                          <div class="text-h6 text-negative">{{
                            formatCurrency(previousMonthReport.expenses) }}</div>
                          <div class="text-caption text-grey-6">Expenses</div>
                        </div>
                      </div>
                    </div>
                    <q-separator class="q-my-md" />
                    <div class="text-center">
                      <div class="text-h5"
                        :class="previousMonthReport.netIncome >= 0 ? 'text-positive' : 'text-negative'">
                        {{ formatCurrency(previousMonthReport.netIncome) }}
                      </div>
                      <div class="text-caption text-grey-6">Net Income</div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Yearly Overview -->
      <div class="q-pa-md" v-if="reportSettings.period === 'yearly'">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Yearly Overview ({{ reportSettings.year }})</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3">
                <q-card flat bordered>
                  <q-card-section class="text-center">
                    <q-icon name="trending_up" size="2rem" color="positive" class="q-mb-sm" />
                    <div class="text-h6 text-weight-bold text-positive">{{
                      formatCurrency(yearlyReport.totalIncome) }}</div>
                    <div class="text-caption text-grey-6">Total Income</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-3">
                <q-card flat bordered>
                  <q-card-section class="text-center">
                    <q-icon name="trending_down" size="2rem" color="negative" class="q-mb-sm" />
                    <div class="text-h6 text-weight-bold text-negative">{{
                      formatCurrency(yearlyReport.totalExpenses) }}</div>
                    <div class="text-caption text-grey-6">Total Expenses</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-3">
                <q-card flat bordered>
                  <q-card-section class="text-center">
                    <q-icon name="account_balance" size="2rem"
                      :color="yearlyReport.netIncome >= 0 ? 'positive' : 'negative'" class="q-mb-sm" />
                    <div class="text-h6 text-weight-bold"
                      :class="yearlyReport.netIncome >= 0 ? 'text-positive' : 'text-negative'">
                      {{ formatCurrency(yearlyReport.netIncome) }}
                    </div>
                    <div class="text-caption text-grey-6">Net Income</div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-3">
                <q-card flat bordered>
                  <q-card-section class="text-center">
                    <q-icon name="receipt" size="2rem" color="info" class="q-mb-sm" />
                    <div class="text-h6 text-weight-bold text-info">{{ yearlyReport.totalTransactions }}
                    </div>
                    <div class="text-caption text-grey-6">Total Transactions</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Category Analysis Table -->
      <div class="q-pa-md">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Category Analysis (Last 6 Months)</div>
            <q-table :rows="categoryAnalysis" :columns="categoryColumns" row-key="categoryId"
              :pagination="{ rowsPerPage: 10 }" flat bordered>
              <template v-slot:body-cell-categoryName="props">
                <q-td :props="props">
                  <div class="row items-center">
                    <div class="category-color-indicator q-mr-sm" :style="{ backgroundColor: props.row.color }"></div>
                    {{ props.value }}
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-amount="props">
                <q-td :props="props">
                  <span class="text-weight-bold">{{ formatCurrency(props.value) }}</span>
                </q-td>
              </template>
              <template v-slot:body-cell-percentage="props">
                <q-td :props="props">
                  <div class="row items-center">
                    <q-linear-progress :value="props.value / 100" :color="props.row.color" size="8px" class="q-mr-sm"
                      style="width: 60px" />
                    <span>{{ props.value.toFixed(1) }}%</span>
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-averageTransaction="props">
                <q-td :props="props">
                  <span>{{ formatCurrency(props.value) }}</span>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- Monthly Breakdown Table -->
      <div class="q-pa-md" v-if="reportSettings.period === 'yearly'">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Monthly Breakdown ({{ reportSettings.year }})</div>
            <q-table :rows="yearlyReport.monthlyReports" :columns="monthlyColumns" row-key="month"
              :pagination="{ rowsPerPage: 12 }" flat bordered>
              <template v-slot:body-cell-income="props">
                <q-td :props="props">
                  <span class="text-positive text-weight-bold">{{ formatCurrency(props.value) }}</span>
                </q-td>
              </template>
              <template v-slot:body-cell-expenses="props">
                <q-td :props="props">
                  <span class="text-negative text-weight-bold">{{ formatCurrency(props.value) }}</span>
                </q-td>
              </template>
              <template v-slot:body-cell-netIncome="props">
                <q-td :props="props">
                  <span class="text-weight-bold" :class="props.value >= 0 ? 'text-positive' : 'text-negative'">
                    {{ formatCurrency(props.value) }}
                  </span>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </q-pull-to-refresh>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { formatCurrency } from 'src/utils/formatters'
import { Line as LineChart, Doughnut as DoughnutChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  LinearScale,
  CategoryScale
} from 'chart.js'

ChartJS.register(
  Title, Tooltip, Legend, LineElement, PointElement,
  ArcElement, LinearScale, CategoryScale
)

const financialStore = useFinancialStore()

// State
const reportSettings = ref({
  period: 'monthly',
  year: new Date().getFullYear(),
  month: new Date().getMonth()
})

// Live page state
const isRefreshing = ref(false)
const lastUpdateTime = ref(new Date())
const refreshKey = ref(0)

const periodOptions = [
  { label: 'Monthly Report', value: 'monthly' },
  { label: 'Yearly Report', value: 'yearly' }
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push({ label: i.toString(), value: i })
  }
  return years
})

const monthOptions = [
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 }
]

const categoryColumns = [
  { name: 'categoryName', label: 'Category', field: 'categoryName', align: 'left' },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' },
  { name: 'percentage', label: 'Percentage', field: 'percentage', align: 'center' },
  { name: 'transactionCount', label: 'Transactions', field: 'transactionCount', align: 'center' },
  { name: 'averageTransaction', label: 'Avg Transaction', field: 'averageTransaction', align: 'right' }
]

const monthlyColumns = [
  { name: 'monthName', label: 'Month', field: 'monthName', align: 'left' },
  { name: 'income', label: 'Income', field: 'income', align: 'right' },
  { name: 'expenses', label: 'Expenses', field: 'expenses', align: 'right' },
  { name: 'netIncome', label: 'Net Income', field: 'netIncome', align: 'right' },
  { name: 'transactionCount', label: 'Transactions', field: 'transactionCount', align: 'center' }
]

// Computed
const netWorthHistory = computed(() => financialStore.generateNetWorthHistory())
const trendAnalysis = computed(() => financialStore.generateTrendAnalysis())
const categoryAnalysis = computed(() => financialStore.generateCategoryAnalysis())

const currentMonthReport = computed(() => {
  return financialStore.generateMonthlyReport(reportSettings.value.year, reportSettings.value.month)
})

const previousMonthReport = computed(() => {
  const prevMonth = reportSettings.value.month === 0 ? 11 : reportSettings.value.month - 1
  const prevYear = reportSettings.value.month === 0 ? reportSettings.value.year - 1 : reportSettings.value.year
  return financialStore.generateMonthlyReport(prevYear, prevMonth)
})

const yearlyReport = computed(() => {
  return financialStore.generateYearlyReport(reportSettings.value.year)
})

const netWorthChartData = computed(() => {
  return {
    labels: netWorthHistory.value.map(month => month.monthName),
    datasets: [
      {
        label: 'Net Worth',
        data: netWorthHistory.value.map(month => month.netWorth),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Income',
        data: netWorthHistory.value.map(month => month.income),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      },
      {
        label: 'Expenses',
        data: netWorthHistory.value.map(month => month.expenses),
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4
      }
    ]
  }
})

const categoryChartData = computed(() => {
  return {
    labels: categoryAnalysis.value.map(cat => cat.categoryName),
    datasets: [
      {
        data: categoryAnalysis.value.map(cat => cat.amount),
        backgroundColor: categoryAnalysis.value.map(cat => cat.color)
      }
    ]
  }
})

const netWorthChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: function (value) {
          return '$' + value.toFixed(0)
        }
      }
    }
  }
}

const categoryChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

// Live page methods
const triggerPageRefresh = async () => {
  isRefreshing.value = true
  lastUpdateTime.value = new Date()
  refreshKey.value++

  // Force re-computation of all data
  await nextTick()

  // Small delay to show refresh indicator
  setTimeout(() => {
    isRefreshing.value = false
  }, 500)
}

const onRefresh = async (done) => {
  await triggerPageRefresh()
  done()
}

// Methods
const refreshReports = () => {
  // Force reactivity update
  triggerPageRefresh()
}

const exportToPDF = () => {
  // TODO: Implement PDF export
}

const exportToCSV = () => {
  // TODO: Implement CSV export
}

// Watch for changes in financial data
watch(() => financialStore.transactions, () => {
  triggerPageRefresh()
}, { deep: true })

watch(() => financialStore.goals, () => {
  triggerPageRefresh()
}, { deep: true })

watch(() => financialStore.recurringTransactions, () => {
  triggerPageRefresh()
}, { deep: true })

onMounted(() => {
  financialStore.loadFromLocalStorage()
})
</script>

<style scoped>
.advanced-reports-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.trend-card {
  transition: transform 0.2s;
}

.trend-card:hover {
  transform: translateY(-2px);
}

.chart-container {
  height: 300px;
  position: relative;
}

.category-color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
