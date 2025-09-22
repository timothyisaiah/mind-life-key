<template>
    <div class="expense-chart">
        <q-card class="chart-card">
            <q-card-section>
                <div class="text-h6 text-center q-mb-md">Monthly Expenses by Category</div>
                <div v-if="chartData.labels.length === 0" class="text-center text-grey-6 q-py-lg">
                    No expense data available
                </div>
                <div v-else class="chart-container">
                    <DoughnutChart :data="chartData" :options="chartOptions" />
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut as DoughnutChart } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    CategoryScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const props = defineProps({
    expenses: {
        type: Array,
        default: () => []
    }
})

const chartData = computed(() => {
    if (props.expenses.length === 0) {
        return {
            labels: [],
            datasets: []
        }
    }

    return {
        labels: props.expenses.map(expense => expense.name),
        datasets: [
            {
                data: props.expenses.map(expense => expense.amount),
                backgroundColor: props.expenses.map(expense => expense.color),
                borderColor: props.expenses.map(expense => expense.color),
                borderWidth: 2,
                hoverOffset: 4
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                    size: 12
                }
            }
        },
        tooltip: {
            callbacks: {
                label: function (context) {
                    const label = context.label || ''
                    const value = context.parsed
                    const total = context.dataset.data.reduce((a, b) => a + b, 0)
                    const percentage = ((value / total) * 100).toFixed(1)
                    return `${label}: $${value.toFixed(2)} (${percentage}%)`
                }
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
