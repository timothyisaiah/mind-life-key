<template>
    <div class="balance-chart">
        <q-card class="chart-card">
            <q-card-section>
                <div class="text-h6 text-center q-mb-md">Balance Trend (Last 30 Days)</div>
                <div v-if="chartData.labels.length === 0" class="text-center text-grey-6 q-py-lg">
                    No transaction data available
                </div>
                <div v-else class="chart-container">
                    <LineChart :data="chartData" :options="chartOptions" />
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line as LineChart } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale)

const props = defineProps({
    transactions: {
        type: Array,
        default: () => []
    },
    startingBalance: {
        type: Number,
        default: 0
    }
})

const chartData = computed(() => {
    if (props.transactions.length === 0) {
        return {
            labels: [],
            datasets: []
        }
    }

    // Generate last 30 days
    const labels = []
    const balanceData = []
    let currentBalance = props.startingBalance

    for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

        // Calculate balance for this day
        const dayTransactions = props.transactions.filter(t => {
            const transactionDate = new Date(t.date)
            return transactionDate.toDateString() === date.toDateString()
        })

        dayTransactions.forEach(t => {
            if (t.type === 'income') {
                currentBalance += t.amount
            } else {
                currentBalance -= t.amount
            }
        })

        balanceData.push(currentBalance)
    }

    return {
        labels,
        datasets: [
            {
                label: 'Balance',
                data: balanceData,
                borderColor: '#26A69A',
                backgroundColor: 'rgba(38, 166, 154, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#26A69A',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            callbacks: {
                label: function (context) {
                    return `Balance: $${context.parsed.y.toFixed(2)}`
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: false,
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
                callback: function (value) {
                    return '$' + value.toFixed(0)
                }
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    }
}
</script>

<style scoped>
.chart-card {
    height: 400px;
}

.chart-container {
    height: 300px;
    position: relative;
}
</style>
