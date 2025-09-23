<template>
  <q-page class="cash-flow-forecaster-page">
    <!-- Header -->
    <div class="page-header q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <h4 class="text-h4 text-weight-bold q-ma-none">Cash Flow Forecaster</h4>
          <p class="text-subtitle1 text-grey-6 q-ma-none">Project your financial future with scenario planning
          </p>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" icon="refresh" label="Refresh Projection" @click="refreshProjection" />
          <q-btn color="secondary" icon="save" label="Save Scenario" @click="showSaveScenarioDialog" />
        </div>
      </div>
    </div>

    <!-- Controls Section -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Forecast Settings</div>
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-md-3">
              <q-select v-model="forecastSettings.months" :options="monthOptions" label="Forecast Period" outlined
                emit-value map-options />
            </div>
            <div class="col-12 col-md-3">
              <q-select v-model="forecastSettings.scenario" :options="scenarioOptions" label="Scenario" outlined
                emit-value map-options @update:model-value="applyScenario" />
            </div>
            <div class="col-12 col-md-3">
              <q-btn color="primary" label="Apply Changes" @click="refreshProjection" class="full-width" />
            </div>
            <div class="col-12 col-md-3">
              <q-btn color="secondary" label="Reset to Default" @click="resetToDefault" class="full-width" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- What-If Scenarios -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">What-If Scenarios</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 q-mb-md">Income Adjustments</div>
                  <q-slider v-model="scenarios.historicalIncomeMultiplier" :min="0.5" :max="2" :step="0.1" label
                    label-always :label-value="`${Math.round(scenarios.historicalIncomeMultiplier * 100)}%`"
                    color="positive" @change="refreshProjection" />
                  <div class="text-caption text-center q-mt-sm">
                    Historical Income Multiplier
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-6">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle1 q-mb-md">Expense Adjustments</div>
                  <q-slider v-model="scenarios.historicalExpensesMultiplier" :min="0.5" :max="2" :step="0.1" label
                    label-always :label-value="`${Math.round(scenarios.historicalExpensesMultiplier * 100)}%`"
                    color="negative" @change="refreshProjection" />
                  <div class="text-caption text-center q-mt-sm">
                    Historical Expenses Multiplier
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Summary Cards -->
    <div class="q-pa-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="account_balance" size="2rem" color="primary" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold"
                :class="projectionSummary.endingBalance >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(projectionSummary.endingBalance) }}
              </div>
              <div class="text-caption text-grey-6">Ending Balance</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="trending_up" size="2rem" color="positive" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold text-positive">{{
                formatCurrency(projectionSummary.totalIncome) }}</div>
              <div class="text-caption text-grey-6">Total Income</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="trending_down" size="2rem" color="negative" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold text-negative">{{
                formatCurrency(projectionSummary.totalExpenses) }}</div>
              <div class="text-caption text-grey-6">Total Expenses</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="show_chart" size="2rem" color="info" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold"
                :class="projectionSummary.netCashFlow >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(projectionSummary.netCashFlow) }}
              </div>
              <div class="text-caption text-grey-6">Net Cash Flow</div>
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
              <div class="text-h6 q-mb-md">Cash Flow Projection</div>
              <div class="chart-container">
                <LineChart :data="projectionChartData" :options="projectionChartOptions" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-lg-4">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">Monthly Breakdown</div>
              <div class="chart-container">
                <DoughnutChart :data="breakdownChartData" :options="breakdownChartOptions" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Detailed Projection Table -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Monthly Projection Details</div>
          <q-table :rows="projection" :columns="projectionColumns" row-key="month" :pagination="{ rowsPerPage: 12 }"
            flat bordered>
            <template v-slot:body-cell-startingBalance="props">
              <q-td :props="props">
                <span :class="props.value >= 0 ? 'text-positive' : 'text-negative'">
                  {{ formatCurrency(props.value) }}
                </span>
              </q-td>
            </template>
            <template v-slot:body-cell-endingBalance="props">
              <q-td :props="props">
                <span :class="props.value >= 0 ? 'text-positive' : 'text-negative'">
                  {{ formatCurrency(props.value) }}
                </span>
              </q-td>
            </template>
            <template v-slot:body-cell-netCashFlow="props">
              <q-td :props="props">
                <span :class="props.value >= 0 ? 'text-positive' : 'text-negative'">
                  {{ formatCurrency(props.value) }}
                </span>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- Save Scenario Dialog -->
    <q-dialog v-model="showSaveDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Save Scenario</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="saveScenario" class="q-col-gutter-md">
            <q-input v-model="scenarioName" label="Scenario Name" outlined
              :rules="[val => !!val || 'Scenario name is required']" />
            <q-input v-model="scenarioDescription" label="Description (optional)" outlined type="textarea" rows="3" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showSaveDialog = false" />
          <q-btn color="primary" label="Save" @click="saveScenario" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
const projection = ref([])
const scenarios = ref({
  historicalIncomeMultiplier: 1,
  historicalExpensesMultiplier: 1
})
const forecastSettings = ref({
  months: 12,
  scenario: 'current'
})
const showSaveDialog = ref(false)
const scenarioName = ref('')
const scenarioDescription = ref('')

const monthOptions = [
  { label: '6 Months', value: 6 },
  { label: '12 Months', value: 12 },
  { label: '18 Months', value: 18 },
  { label: '24 Months', value: 24 },
  { label: '36 Months', value: 36 }
]

const scenarioOptions = [
  { label: 'Current Trends', value: 'current' },
  { label: 'Optimistic', value: 'optimistic' },
  { label: 'Pessimistic', value: 'pessimistic' },
  { label: 'Conservative', value: 'conservative' }
]

const projectionColumns = [
  { name: 'monthName', label: 'Month', field: 'monthName', align: 'left' },
  { name: 'startingBalance', label: 'Starting Balance', field: 'startingBalance', align: 'right' },
  { name: 'totalIncome', label: 'Total Income', field: 'totalIncome', align: 'right' },
  { name: 'totalExpenses', label: 'Total Expenses', field: 'totalExpenses', align: 'right' },
  { name: 'netCashFlow', label: 'Net Cash Flow', field: 'netCashFlow', align: 'right' },
  { name: 'endingBalance', label: 'Ending Balance', field: 'endingBalance', align: 'right' }
]

// Computed
const projectionSummary = computed(() => {
  if (projection.value.length === 0) {
    return { endingBalance: 0, totalIncome: 0, totalExpenses: 0, netCashFlow: 0 }
  }

  const lastMonth = projection.value[projection.value.length - 1]
  const totalIncome = projection.value.reduce((sum, month) => sum + month.totalIncome, 0)
  const totalExpenses = projection.value.reduce((sum, month) => sum + month.totalExpenses, 0)
  const netCashFlow = totalIncome - totalExpenses

  return {
    endingBalance: lastMonth.endingBalance,
    totalIncome,
    totalExpenses,
    netCashFlow
  }
})

const projectionChartData = computed(() => {
  if (projection.value.length === 0) {
    return { labels: [], datasets: [] }
  }

  return {
    labels: projection.value.map(month => month.monthName),
    datasets: [
      {
        label: 'Ending Balance',
        data: projection.value.map(month => month.endingBalance),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Net Cash Flow',
        data: projection.value.map(month => month.netCashFlow),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      }
    ]
  }
})

const breakdownChartData = computed(() => {
  if (projection.value.length === 0) {
    return { labels: [], datasets: [] }
  }

  const totalIncome = projection.value.reduce((sum, month) => sum + month.totalIncome, 0)
  const totalExpenses = projection.value.reduce((sum, month) => sum + month.totalExpenses, 0)

  return {
    labels: ['Total Income', 'Total Expenses'],
    datasets: [
      {
        data: [totalIncome, totalExpenses],
        backgroundColor: ['#4caf50', '#f44336']
      }
    ]
  }
})

const projectionChartOptions = {
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

const breakdownChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

// Methods
const refreshProjection = () => {
  projection.value = financialStore.generateCashFlowProjection(forecastSettings.value.months, scenarios.value)
}

const applyScenario = (scenario) => {
  switch (scenario) {
    case 'optimistic':
      scenarios.value = {
        historicalIncomeMultiplier: 1.2,
        historicalExpensesMultiplier: 0.9
      }
      break
    case 'pessimistic':
      scenarios.value = {
        historicalIncomeMultiplier: 0.8,
        historicalExpensesMultiplier: 1.2
      }
      break
    case 'conservative':
      scenarios.value = {
        historicalIncomeMultiplier: 0.9,
        historicalExpensesMultiplier: 1.1
      }
      break
    default:
      scenarios.value = {
        historicalIncomeMultiplier: 1,
        historicalExpensesMultiplier: 1
      }
  }
  refreshProjection()
}

const resetToDefault = () => {
  scenarios.value = {
    historicalIncomeMultiplier: 1,
    historicalExpensesMultiplier: 1
  }
  forecastSettings.value.scenario = 'current'
  refreshProjection()
}

const showSaveScenarioDialog = () => {
  scenarioName.value = ''
  scenarioDescription.value = ''
  showSaveDialog.value = true
}

const saveScenario = () => {
  if (scenarioName.value) {
    // TODO: Implement scenario saving
    console.log('Saving scenario:', scenarioName.value, scenarios.value)
    showSaveDialog.value = false
  }
}

onMounted(() => {
  financialStore.loadFromLocalStorage()
  refreshProjection()
})
</script>

<style scoped>
.cash-flow-forecaster-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-card {
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.chart-container {
  height: 300px;
  position: relative;
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
