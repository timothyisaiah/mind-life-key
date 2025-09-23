<template>
  <q-page class="goals-page">
    <!-- Header -->
    <div class="page-header q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <h4 class="text-h4 text-weight-bold q-ma-none">Savings Goals</h4>
          <p class="text-subtitle1 text-grey-6 q-ma-none">Track your financial goals and milestones</p>
        </div>
        <q-btn color="primary" icon="add" label="New Goal" @click="showAddGoalDialog" />
      </div>
    </div>

    <!-- Goals Overview Cards -->
    <div class="q-pa-md">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-card class="overview-card">
            <q-card-section class="text-center">
              <q-icon name="flag" size="2rem" color="primary" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold">{{ goals.length }}</div>
              <div class="text-caption text-grey-6">Total Goals</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="overview-card">
            <q-card-section class="text-center">
              <q-icon name="check_circle" size="2rem" color="positive" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold">{{ completedGoals.length }}</div>
              <div class="text-caption text-grey-6">Completed</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="overview-card">
            <q-card-section class="text-center">
              <q-icon name="schedule" size="2rem" color="warning" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold">{{ activeGoals.length }}</div>
              <div class="text-caption text-grey-6">In Progress</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Goals List -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="text-h6 q-mb-md">Your Goals</div>

          <div v-if="goals.length === 0" class="text-center text-grey-6 q-py-xl">
            <q-icon name="flag" size="4rem" class="q-mb-md" />
            <div class="text-h6">No goals yet</div>
            <div class="text-body2">Create your first savings goal to get started</div>
          </div>

          <div v-else class="row q-col-gutter-md">
            <div v-for="goal in goals" :key="goal.id" class="col-12 col-md-6 col-lg-4">
              <q-card class="goal-card" :class="{
                'goal-completed': isGoalCompleted(goal),
                'goal-overdue': isGoalOverdue(goal)
              }">
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle1 text-weight-bold">{{ goal.name }}</div>
                    <q-btn-group flat>
                      <q-btn flat round icon="edit" color="primary" size="sm" @click="editGoal(goal)" />
                      <q-btn flat round icon="delete" color="negative" size="sm" @click="confirmDeleteGoal(goal)" />
                    </q-btn-group>
                  </div>

                  <div class="text-caption text-grey-6 q-mb-sm">
                    Target: {{ formatCurrency(goal.targetAmount) }} by {{ formatDate(goal.targetDate) }}
                  </div>

                  <q-linear-progress :value="Math.min(goal.currentAmount / goal.targetAmount, 1)"
                    :color="getProgressColor(goal)" size="20px" rounded class="q-mb-sm" />

                  <div class="row items-center justify-between">
                    <div class="text-caption">
                      {{ formatCurrency(goal.currentAmount) }} / {{ formatCurrency(goal.targetAmount) }}
                    </div>
                    <div class="text-caption text-weight-bold">
                      {{ Math.round((goal.currentAmount / goal.targetAmount) * 100) }}%
                    </div>
                  </div>

                  <div v-if="goal.description" class="text-caption text-grey-6 q-mt-sm">
                    {{ goal.description }}
                  </div>

                  <div class="q-mt-md">
                    <q-btn flat color="primary" size="sm" icon="add" label="Add Money"
                      @click="showAddMoneyDialog(goal)" />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Add/Edit Goal Dialog -->
    <q-dialog v-model="showGoalDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">
            {{ editingGoal ? 'Edit Goal' : 'Create New Goal' }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="saveGoal" class="q-col-gutter-md">
            <q-input v-model="goalForm.name" label="Goal Name" outlined
              :rules="[val => !!val || 'Goal name is required']" />
            <q-input v-model.number="goalForm.targetAmount" label="Target Amount" type="number" step="0.01" outlined
              :rules="[val => val > 0 || 'Target amount must be greater than 0']" />
            <q-input v-model="goalForm.targetDate" label="Target Date" type="date" outlined
              :rules="[val => !!val || 'Target date is required']" />
            <q-input v-model="goalForm.description" label="Description (optional)" outlined type="textarea" rows="3" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeGoalDialog" />
          <q-btn color="primary" label="Save" @click="saveGoal" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Money Dialog -->
    <q-dialog v-model="showAddMoneyDialogState" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Money to Goal</div>
          <div class="text-subtitle2 text-grey-6">{{ selectedGoal?.name }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="addMoneyToGoal" class="q-col-gutter-md">
            <q-input v-model.number="addMoneyForm.amount" label="Amount to Add" type="number" step="0.01" outlined
              :rules="[val => val > 0 || 'Amount must be greater than 0']" />
            <q-input v-model="addMoneyForm.notes" label="Notes (optional)" outlined type="textarea" rows="2" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeAddMoneyDialog" />
          <q-btn color="primary" label="Add Money" @click="addMoneyToGoal" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Goal</div>
        </q-card-section>
        <q-card-section>
          Are you sure you want to delete "{{ goalToDelete?.name }}"?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showDeleteDialog = false" />
          <q-btn color="negative" label="Delete" @click="deleteGoal" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinancialStore } from 'src/stores/financial'
import { formatCurrency, formatDate } from 'src/utils/formatters'

const financialStore = useFinancialStore()

// State
const showGoalDialog = ref(false)
const showAddMoneyDialogState = ref(false)
const showDeleteDialog = ref(false)
const editingGoal = ref(null)
const selectedGoal = ref(null)
const goalToDelete = ref(null)

const goalForm = ref({
  name: '',
  targetAmount: 0,
  targetDate: '',
  description: ''
})

const addMoneyForm = ref({
  amount: 0,
  notes: ''
})

// Computed
const { goals } = financialStore

const activeGoals = computed(() => {
  return goals.filter(goal => {
    const targetDate = new Date(goal.targetDate)
    const today = new Date()
    return targetDate > today && goal.currentAmount < goal.targetAmount
  })
})

const completedGoals = computed(() => {
  return goals.filter(goal => goal.currentAmount >= goal.targetAmount)
})

// Methods
const isGoalCompleted = (goal) => {
  return goal.currentAmount >= goal.targetAmount
}

const isGoalOverdue = (goal) => {
  const targetDate = new Date(goal.targetDate)
  const today = new Date()
  return targetDate < today && goal.currentAmount < goal.targetAmount
}

const getProgressColor = (goal) => {
  if (isGoalCompleted(goal)) return 'positive'
  if (isGoalOverdue(goal)) return 'negative'
  const progress = goal.currentAmount / goal.targetAmount
  if (progress >= 0.8) return 'warning'
  return 'primary'
}

const showAddGoalDialog = () => {
  editingGoal.value = null
  goalForm.value = {
    name: '',
    targetAmount: 0,
    targetDate: '',
    description: ''
  }
  showGoalDialog.value = true
}

const editGoal = (goal) => {
  editingGoal.value = goal
  goalForm.value = {
    name: goal.name,
    targetAmount: goal.targetAmount,
    targetDate: goal.targetDate,
    description: goal.description || ''
  }
  showGoalDialog.value = true
}

const closeGoalDialog = () => {
  showGoalDialog.value = false
  editingGoal.value = null
  goalForm.value = {
    name: '',
    targetAmount: 0,
    targetDate: '',
    description: ''
  }
}

const saveGoal = () => {
  if (goalForm.value.name && goalForm.value.targetAmount > 0 && goalForm.value.targetDate) {
    if (editingGoal.value) {
      financialStore.updateGoal(editingGoal.value.id, goalForm.value)
    } else {
      financialStore.addGoal(goalForm.value)
    }
    closeGoalDialog()
  }
}

const showAddMoneyDialog = (goal) => {
  selectedGoal.value = goal
  addMoneyForm.value = {
    amount: 0,
    notes: ''
  }
  showAddMoneyDialogState.value = true
}

const closeAddMoneyDialog = () => {
  showAddMoneyDialogState.value = false
  selectedGoal.value = null
  addMoneyForm.value = {
    amount: 0,
    notes: ''
  }
}

const addMoneyToGoal = () => {
  if (addMoneyForm.value.amount > 0 && selectedGoal.value) {
    const newAmount = selectedGoal.value.currentAmount + addMoneyForm.value.amount
    financialStore.updateGoal(selectedGoal.value.id, {
      currentAmount: newAmount
    })
    closeAddMoneyDialog()
  }
}

const confirmDeleteGoal = (goal) => {
  goalToDelete.value = goal
  showDeleteDialog.value = true
}

const deleteGoal = () => {
  if (goalToDelete.value) {
    financialStore.deleteGoal(goalToDelete.value.id)
    showDeleteDialog.value = false
    goalToDelete.value = null
  }
}

onMounted(() => {
  financialStore.loadFromLocalStorage()
})
</script>

<style scoped>
.goals-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.overview-card {
  transition: transform 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
}

.goal-card {
  transition: transform 0.2s;
  height: 100%;
}

.goal-card:hover {
  transform: translateY(-2px);
}

.goal-completed {
  border-left: 4px solid #4CAF50;
}

.goal-overdue {
  border-left: 4px solid #F44336;
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
