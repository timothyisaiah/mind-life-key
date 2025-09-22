<template>
    <q-page class="reports-page">
        <!-- Header -->
        <div class="page-header q-pa-md">
            <div class="row items-center justify-between">
                <div>
                    <h4 class="text-h4 text-weight-bold q-ma-none">Reports</h4>
                    <p class="text-subtitle1 text-grey-6 q-ma-none">Financial insights and analytics</p>
                </div>
                <div class="row q-gutter-sm">
                    <q-btn color="primary" icon="download" label="Export PDF" @click="exportToPDF" />
                    <q-btn color="secondary" icon="table_chart" label="Export CSV" @click="exportToCSV" />
                </div>
            </div>
        </div>

        <!-- Date Range Selector -->
        <div class="q-pa-md">
            <q-card>
                <q-card-section>
                    <div class="row q-gutter-md items-center">
                        <div class="col-12 col-md-3">
                            <q-select v-model="selectedPeriod" :options="periodOptions" label="Time Period" outlined
                                emit-value map-options @update:model-value="updateDateRange" />
                        </div>
                        <div class="col-12 col-md-3">
                            <q-input v-model="customStartDate" label="Start Date" type="date" outlined
                                :disable="selectedPeriod !== 'custom'" />
                        </div>
                        <div class="col-12 col-md-3">
                            <q-input v-model="customEndDate" label="End Date" type="date" outlined
                                :disable="selectedPeriod !== 'custom'" />
                        </div>
                        <div class="col-12 col-md-3">
                            <q-btn color="primary" label="Update Report" @click="updateReport" class="full-width" />
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Summary Cards -->
        <div class="q-pa-md">
            <div class="row q-gutter-md">
                <div class="col-12 col-md-3">
                    <q-card class="summary-card">
                        <q-card-section class="text-center">
                            <q-icon name="trending_up" size="2rem" color="positive" class="q-mb-sm" />
                            <div class="text-h6 text-weight-bold text-positive">{{ formatCurrency(periodIncome) }}</div>
                            <div class="text-caption text-grey-6">Total Income</div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-3">
                    <q-card class="summary-card">
                        <q-card-section class="text-center">
                            <q-icon name="trending_down" size="2rem" color="negative" class="q-mb-sm" />
                            <div class="text-h6 text-weight-bold text-negative">{{ formatCurrency(periodExpenses) }}
                            </div>
                            <div class="text-caption text-grey-6">Total Expenses</div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-3">
                    <q-card class="summary-card">
                        <q-card-section class="text-center">
                            <q-icon name="account_balance" size="2rem" color="primary" class="q-mb-sm" />
                            <div class="text-h6 text-weight-bold"
                                :class="(periodIncome - periodExpenses) >= 0 ? 'text-positive' : 'text-negative'">
                                {{ formatCurrency(periodIncome - periodExpenses) }}
                            </div>
                            <div class="text-caption text-grey-6">Net Income</div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-3">
                    <q-card class="summary-card">
                        <q-card-section class="text-center">
                            <q-icon name="percent" size="2rem" color="info" class="q-mb-sm" />
                            <div class="text-h6 text-weight-bold text-info">{{ savingsRate }}%</div>
                            <div class="text-caption text-grey-6">Savings Rate</div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="q-pa-md">
            <div class="row q-gutter-md">
                <div class="col-12 col-lg-6">
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Income vs Expenses Trend</div>
                            <div class="chart-container">
                                <LineChart :data="trendChartData" :options="trendChartOptions" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-lg-6">
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Expenses by Category</div>
                            <div class="chart-container">
                                <DoughnutChart :data="categoryChartData" :options="categoryChartOptions" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Detailed Breakdown -->
        <div class="q-pa-md">
            <div class="row q-gutter-md">
                <!-- Income Breakdown -->
                <div class="col-12 col-lg-6">
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Income Breakdown</div>
                            <div v-if="incomeByCategory.length === 0" class="text-center text-grey-6 q-py-lg">
                                No income data for this period
                            </div>
                            <div v-else>
                                <q-list>
                                    <q-item v-for="item in incomeByCategory" :key="item.category" class="q-px-none">
                                        <q-item-section>
                                            <q-item-label>{{ item.category }}</q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-item-label class="text-weight-bold text-positive">
                                                {{ formatCurrency(item.amount) }}
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <!-- Expense Breakdown -->
                <div class="col-12 col-lg-6">
                    <q-card>
                        <q-card-section>
                            <div class="text-h6 q-mb-md">Expense Breakdown</div>
                            <div v-if="expensesByCategory.length === 0" class="text-center text-grey-6 q-py-lg">
                                No expense data for this period
                            </div>
                            <div v-else>
                                <q-list>
                                    <q-item v-for="item in expensesByCategory" :key="item.category" class="q-px-none">
                                        <q-item-section>
                                            <q-item-label>{{ item.category }}</q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-item-label class="text-weight-bold text-negative">
                                                {{ formatCurrency(item.amount) }}
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Monthly Comparison -->
        <div class="q-pa-md" v-if="monthlyData.length > 1">
            <q-card>
                <q-card-section>
                    <div class="text-h6 q-mb-md">Monthly Comparison</div>
                    <div class="chart-container">
                        <BarChart :data="monthlyComparisonData" :options="monthlyComparisonOptions" />
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { formatCurrency } from 'src/utils/formatters'
import { Line as LineChart, Doughnut as DoughnutChart, Bar as BarChart } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    BarElement,
    ArcElement,
    LinearScale,
    CategoryScale
} from 'chart.js'

ChartJS.register(
    Title, Tooltip, Legend, LineElement, PointElement,
    BarElement, ArcElement, LinearScale, CategoryScale
)

const financialStore = useFinancialStore()

// State
const selectedPeriod = ref('thisMonth')
const customStartDate = ref('')
const customEndDate = ref('')
const startDate = ref('')
const endDate = ref('')

const periodOptions = [
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Last 3 Months', value: 'last3Months' },
    { label: 'Last 6 Months', value: 'last6Months' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Custom', value: 'custom' }
]

// Computed
const { transactions, categories } = financialStore

const filteredTransactions = computed(() => {
    if (!startDate.value || !endDate.value) return []

    return transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= new Date(startDate.value) && transactionDate <= new Date(endDate.value)
    })
})

const periodIncome = computed(() => {
    return filteredTransactions.value
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
})

const periodExpenses = computed(() => {
    return filteredTransactions.value
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
})

const savingsRate = computed(() => {
    if (periodIncome.value === 0) return 0
    return Math.round(((periodIncome.value - periodExpenses.value) / periodIncome.value) * 100)
})

const incomeByCategory = computed(() => {
    const categoryTotals = {}

    filteredTransactions.value
        .filter(t => t.type === 'income')
        .forEach(t => {
            const category = categories.find(c => c.id === t.categoryId)
            if (category) {
                if (!categoryTotals[category.name]) {
                    categoryTotals[category.name] = 0
                }
                categoryTotals[category.name] += t.amount
            }
        })

    return Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
})

const expensesByCategory = computed(() => {
    const categoryTotals = {}

    filteredTransactions.value
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const category = categories.find(c => c.id === t.categoryId)
            if (category) {
                if (!categoryTotals[category.name]) {
                    categoryTotals[category.name] = 0
                }
                categoryTotals[category.name] += t.amount
            }
        })

    return Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
})

const monthlyData = computed(() => {
    const months = {}

    filteredTransactions.value.forEach(t => {
        const date = new Date(t.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!months[monthKey]) {
            months[monthKey] = { income: 0, expenses: 0, month: monthKey }
        }

        if (t.type === 'income') {
            months[monthKey].income += t.amount
        } else {
            months[monthKey].expenses += t.amount
        }
    })

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
})

// Chart Data
const trendChartData = computed(() => {
    const labels = []
    const incomeData = []
    const expenseData = []

    monthlyData.value.forEach(month => {
        const date = new Date(month.month + '-01')
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
        incomeData.push(month.income)
        expenseData.push(month.expenses)
    })

    return {
        labels,
        datasets: [
            {
                label: 'Income',
                data: incomeData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
            },
            {
                label: 'Expenses',
                data: expenseData,
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                tension: 0.4
            }
        ]
    }
})

const categoryChartData = computed(() => {
    if (expensesByCategory.value.length === 0) {
        return { labels: [], datasets: [] }
    }

    return {
        labels: expensesByCategory.value.map(item => item.category),
        datasets: [
            {
                data: expensesByCategory.value.map(item => item.amount),
                backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
                ]
            }
        ]
    }
})

const monthlyComparisonData = computed(() => {
    const labels = monthlyData.value.map(month => {
        const date = new Date(month.month + '-01')
        return date.toLocaleDateString('en-US', { month: 'short' })
    })

    return {
        labels,
        datasets: [
            {
                label: 'Income',
                data: monthlyData.value.map(month => month.income),
                backgroundColor: '#4CAF50'
            },
            {
                label: 'Expenses',
                data: monthlyData.value.map(month => month.expenses),
                backgroundColor: '#F44336'
            }
        ]
    }
})

// Chart Options
const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true,
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

const monthlyComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function (value) {
                    return '$' + value.toFixed(0)
                }
            }
        }
    }
}

// Methods
const updateDateRange = () => {
    const today = new Date()
    let start, end

    switch (selectedPeriod.value) {
        case 'thisMonth':
            start = new Date(today.getFullYear(), today.getMonth(), 1)
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            break
        case 'lastMonth':
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            end = new Date(today.getFullYear(), today.getMonth(), 0)
            break
        case 'last3Months':
            start = new Date(today.getFullYear(), today.getMonth() - 3, 1)
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            break
        case 'last6Months':
            start = new Date(today.getFullYear(), today.getMonth() - 6, 1)
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            break
        case 'thisYear':
            start = new Date(today.getFullYear(), 0, 1)
            end = new Date(today.getFullYear(), 11, 31)
            break
        case 'custom':
            start = new Date(customStartDate.value)
            end = new Date(customEndDate.value)
            break
    }

    startDate.value = start.toISOString().split('T')[0]
    endDate.value = end.toISOString().split('T')[0]
}

const updateReport = () => {
    if (selectedPeriod.value === 'custom') {
        startDate.value = customStartDate.value
        endDate.value = customEndDate.value
    } else {
        updateDateRange()
    }
}

const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log('Export to PDF')
}

const exportToCSV = () => {
    const csvData = filteredTransactions.value.map(t => ({
        Date: t.date,
        Description: t.description,
        Type: t.type,
        Category: categories.find(c => c.id === t.categoryId)?.name || 'Unknown',
        Amount: t.amount
    }))

    const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-report-${startDate.value}-to-${endDate.value}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
}

onMounted(() => {
    financialStore.loadFromLocalStorage()
    updateDateRange()
})
</script>

<style scoped>
.reports-page {
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
