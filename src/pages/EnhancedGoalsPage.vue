<template>
  <q-page class="enhanced-goals-page">
    <!-- Header -->
    <div class="page-header q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <h4 class="text-h4 text-weight-bold q-ma-none">Enhanced Goals</h4>
          <p class="text-subtitle1 text-grey-6 q-ma-none">Track progress, earn achievements, and auto-allocate
            savings</p>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" icon="add" label="New Goal" @click="showAddGoalDialog" />
          <q-btn color="secondary" icon="settings" label="Auto-Allocation" @click="showAutoAllocationDialog" />
          <q-btn color="accent" icon="emoji_events" label="Achievements" @click="showAchievementsDialog" />
        </div>
      </div>
    </div>

    <!-- Achievement Notifications -->
    <div class="q-pa-md" v-if="newAchievements.length > 0">
      <q-banner class="bg-positive text-white">
        <template v-slot:avatar>
          <q-icon name="emoji_events" />
        </template>
        <div class="text-h6 q-mb-sm">New Achievement Unlocked!</div>
        <div v-for="achievement in newAchievements" :key="achievement.id" class="q-mb-xs">
          <strong>{{ achievement.title }}</strong> - {{ achievement.description }}
        </div>
        <template v-slot:action>
          <q-btn flat label="Dismiss" @click="dismissAchievements" />
        </template>
      </q-banner>
    </div>

    <!-- Auto-Allocation Status -->
    <div class="q-pa-md" v-if="autoAllocationSettings.enabled">
      <q-card class="auto-allocation-card">
        <q-card-section>
          <div class="row items-center">
            <q-icon name="auto_awesome" size="2rem" color="primary" class="q-mr-md" />
            <div class="col">
              <div class="text-h6">Auto-Allocation Active</div>
              <div class="text-body2 text-grey-6">
                {{ autoAllocationSettings.percentage }}% of extra income will be automatically allocated
                to your
                goals
              </div>
            </div>
            <q-btn flat icon="settings" @click="showAutoAllocationDialog" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Goals Grid -->
    <div class="q-pa-md">
      <div class="row q-col-gutter-md">
        <div v-for="goal in sortedGoals" :key="goal.id" class="col-12 col-md-6 col-lg-4">
          <q-card class="goal-card" :class="{ 'completed': goal.currentAmount >= goal.targetAmount }">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <div class="text-h6 text-weight-bold">{{ goal.name }}</div>
                <q-chip :color="getGoalStatusColor(goal)" text-color="white" :label="getGoalStatus(goal)" />
              </div>

              <div class="goal-progress q-mb-md">
                <div class="row items-center justify-between q-mb-sm">
                  <span class="text-body2">{{ formatCurrency(goal.currentAmount) }}</span>
                  <span class="text-body2 text-grey-6">{{ formatCurrency(goal.targetAmount) }}</span>
                </div>
                <q-linear-progress :value="goal.currentAmount / goal.targetAmount" :color="getGoalStatusColor(goal)"
                  size="20px" rounded />
                <div class="text-caption text-center q-mt-sm">
                  {{ Math.round((goal.currentAmount / goal.targetAmount) * 100) }}% Complete
                </div>
              </div>

              <div class="goal-details q-mb-md">
                <div class="row items-center q-mb-xs">
                  <q-icon name="schedule" size="1rem" class="q-mr-sm" />
                  <span class="text-body2">Target: {{ formatDate(goal.targetDate) }}</span>
                </div>
                <div class="row items-center q-mb-xs">
                  <q-icon name="trending_up" size="1rem" class="q-mr-sm" />
                  <span class="text-body2">Remaining: {{ formatCurrency(goal.targetAmount -
                    goal.currentAmount) }}</span>
                </div>
                <div class="row items-center">
                  <q-icon name="flag" size="1rem" class="q-mr-sm" />
                  <span class="text-body2">Priority: {{ getGoalPriority(goal.id) }}</span>
                </div>
              </div>

              <div class="goal-actions">
                <q-btn color="primary" icon="add" label="Add Money" @click="showAddMoneyDialog(goal)"
                  :disable="goal.currentAmount >= goal.targetAmount" class="full-width q-mb-sm" />
                <div class="row q-gutter-sm">
                  <q-btn flat color="primary" icon="edit" @click="editGoal(goal)" size="sm" />
                  <q-btn flat color="negative" icon="delete" @click="deleteGoal(goal.id)" size="sm" />
                  <q-btn flat color="secondary"
                    :icon="goal.currentAmount >= goal.targetAmount ? 'check_circle' : 'radio_button_unchecked'"
                    @click="toggleGoalPriority(goal.id)" size="sm" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="goals.length === 0" class="text-center q-py-xl">
        <q-icon name="flag" size="4rem" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-6 q-mb-sm">No goals yet</div>
        <div class="text-body2 text-grey-5 q-mb-md">Create your first savings goal to start tracking your
          progress</div>
        <q-btn color="primary" label="Create Goal" @click="showAddGoalDialog" />
      </div>
    </div>

    <!-- Add Goal Dialog -->
    <q-dialog v-model="showAddGoalDialogState" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create New Goal</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="addGoal" class="q-col-gutter-md">
            <q-input v-model="newGoal.name" label="Goal Name" outlined
              :rules="[val => !!val || 'Goal name is required']" />
            <q-input v-model.number="newGoal.targetAmount" label="Target Amount" type="number" outlined
              :rules="[val => val > 0 || 'Target amount must be greater than 0']" />
            <q-input v-model="newGoal.targetDate" label="Target Date" type="date" outlined
              :rules="[val => !!val || 'Target date is required']" />
            <q-input v-model="newGoal.description" label="Description (optional)" outlined type="textarea" rows="3" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showAddGoalDialogState = false" />
          <q-btn color="primary" label="Create Goal" @click="addGoal" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Money Dialog -->
    <q-dialog v-model="showAddMoneyDialogState" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Money to {{ selectedGoal?.name }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="addMoneyToSelectedGoal" class="q-col-gutter-md">
            <q-input v-model.number="moneyToAdd" label="Amount to Add" type="number" outlined
              :rules="[val => val > 0 || 'Amount must be greater than 0']" />
            <div class="text-body2 text-grey-6">
              Current: {{ formatCurrency(selectedGoal?.currentAmount || 0) }} / {{
                formatCurrency(selectedGoal?.targetAmount || 0) }}
            </div>
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showAddMoneyDialogState = false" />
          <q-btn color="primary" label="Add Money" @click="addMoneyToSelectedGoal" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Auto-Allocation Settings Dialog -->
    <q-dialog v-model="showAutoAllocationDialogState" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Auto-Allocation Settings</div>
        </q-card-section>
        <q-card-section>
          <q-form class="q-col-gutter-md">
            <q-toggle v-model="autoAllocationSettings.enabled" label="Enable Auto-Allocation" color="primary" />
            <div v-if="autoAllocationSettings.enabled">
              <q-slider v-model="autoAllocationSettings.percentage" :min="5" :max="50" :step="5" label label-always
                :label-value="`${autoAllocationSettings.percentage}%`" color="primary" />
              <div class="text-caption text-center q-mt-sm">
                Percentage of extra income to auto-allocate
              </div>

              <div class="q-mt-md">
                <div class="text-subtitle1 q-mb-sm">Goal Priority Order</div>
                <q-list bordered>
                  <q-item v-for="(goalId, index) in autoAllocationSettings.priorityOrder" :key="goalId"
                    class="priority-item">
                    <q-item-section avatar>
                      <q-icon :name="`${index + 1}`" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ getGoalById(goalId)?.name }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn flat round icon="close" size="sm" @click="removeFromPriority(goalId)" />
                    </q-item-section>
                  </q-item>
                </q-list>
                <div class="text-caption text-grey-6 q-mt-sm">
                  Drag goals to reorder, or add goals using the priority button
                </div>
              </div>
            </div>
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showAutoAllocationDialogState = false" />
          <q-btn color="primary" label="Save Settings" @click="saveAutoAllocationSettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Achievements Dialog -->
    <q-dialog v-model="showAchievementsDialogState">
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section>
          <div class="text-h6">Your Achievements</div>
        </q-card-section>
        <q-card-section>
          <div v-if="userAchievements.length === 0" class="text-center q-py-lg">
            <q-icon name="emoji_events" size="3rem" color="grey-5" class="q-mb-md" />
            <div class="text-h6 text-grey-6 q-mb-sm">No achievements yet</div>
            <div class="text-body2 text-grey-5">Start working on your goals to unlock achievements!</div>
          </div>
          <div v-else class="row q-col-gutter-md">
            <div v-for="achievement in userAchievements" :key="achievement.id" class="col-12 col-md-6">
              <q-card class="achievement-card">
                <q-card-section class="text-center">
                  <q-icon :name="achievement.icon" size="3rem" color="primary" class="q-mb-md" />
                  <div class="text-h6 text-weight-bold q-mb-sm">{{ achievement.title }}</div>
                  <div class="text-body2 text-grey-6 q-mb-sm">{{ achievement.description }}</div>
                  <div class="text-caption text-grey-5">
                    Earned: {{ formatDate(achievement.earnedAt) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showAchievementsDialogState = false" />
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
const showAddGoalDialogState = ref(false)
const showAddMoneyDialogState = ref(false)
const showAutoAllocationDialogState = ref(false)
const showAchievementsDialogState = ref(false)
const selectedGoal = ref(null)
const moneyToAdd = ref(0)
const newAchievements = ref([])

const newGoal = ref({
  name: '',
  targetAmount: 0,
  targetDate: '',
  description: ''
})

// Computed
const goals = computed(() => financialStore.goals)
const userAchievements = computed(() => financialStore.userAchievements)
const autoAllocationSettings = computed(() => financialStore.autoAllocationSettings)

const sortedGoals = computed(() => {
  return [...goals.value].sort((a, b) => {
    // Sort by priority first, then by target date
    const aPriority = autoAllocationSettings.value.priorityOrder.indexOf(a.id)
    const bPriority = autoAllocationSettings.value.priorityOrder.indexOf(b.id)

    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority
    }
    if (aPriority !== -1) return -1
    if (bPriority !== -1) return 1

    return new Date(a.targetDate) - new Date(b.targetDate)
  })
})

// Methods
const showAddGoalDialog = () => {
  newGoal.value = {
    name: '',
    targetAmount: 0,
    targetDate: '',
    description: ''
  }
  showAddGoalDialogState.value = true
}

const addGoal = () => {
  if (newGoal.value.name && newGoal.value.targetAmount > 0 && newGoal.value.targetDate) {
    financialStore.addGoal(newGoal.value)
    showAddGoalDialogState.value = false
  }
}

const showAddMoneyDialog = (goal) => {
  selectedGoal.value = goal
  moneyToAdd.value = 0
  showAddMoneyDialogState.value = true
}

const addMoneyToSelectedGoal = () => {
  if (selectedGoal.value && moneyToAdd.value > 0) {
    financialStore.addMoneyToGoal(selectedGoal.value.id, moneyToAdd.value)
    showAddMoneyDialogState.value = false

    // Check for new achievements
    checkForNewAchievements()
  }
}

const editGoal = (goal) => {
  // TODO: Implement edit functionality
  console.log('Edit goal:', goal)
}

const deleteGoal = (goalId) => {
  financialStore.deleteGoal(goalId)
}

const getGoalStatus = (goal) => {
  if (goal.currentAmount >= goal.targetAmount) return 'Completed'
  const targetDate = new Date(goal.targetDate)
  const today = new Date()
  if (today > targetDate) return 'Overdue'
  return 'Active'
}

const getGoalStatusColor = (goal) => {
  if (goal.currentAmount >= goal.targetAmount) return 'positive'
  const targetDate = new Date(goal.targetDate)
  const today = new Date()
  if (today > targetDate) return 'negative'
  return 'primary'
}

const getGoalPriority = (goalId) => {
  const index = autoAllocationSettings.value.priorityOrder.indexOf(goalId)
  return index !== -1 ? `#${index + 1}` : 'Not Set'
}

const getGoalById = (goalId) => {
  return goals.value.find(g => g.id === goalId)
}

const toggleGoalPriority = (goalId) => {
  const currentOrder = autoAllocationSettings.value.priorityOrder
  const index = currentOrder.indexOf(goalId)

  if (index !== -1) {
    // Remove from priority
    currentOrder.splice(index, 1)
  } else {
    // Add to priority
    currentOrder.push(goalId)
  }

  financialStore.setGoalPriority([...currentOrder])
}

const removeFromPriority = (goalId) => {
  const currentOrder = autoAllocationSettings.value.priorityOrder
  const index = currentOrder.indexOf(goalId)
  if (index !== -1) {
    currentOrder.splice(index, 1)
    financialStore.setGoalPriority([...currentOrder])
  }
}

const showAutoAllocationDialog = () => {
  showAutoAllocationDialogState.value = true
}

const saveAutoAllocationSettings = () => {
  financialStore.updateAutoAllocationSettings(autoAllocationSettings.value)
  showAutoAllocationDialogState.value = false
}

const showAchievementsDialog = () => {
  showAchievementsDialogState.value = true
}

const checkForNewAchievements = () => {
  // This would be called after adding money to check for new achievements
  // The actual achievement checking is done in the store
}

const dismissAchievements = () => {
  newAchievements.value = []
}

onMounted(() => {
  financialStore.loadFromLocalStorage()
})
</script>

<style scoped>
.enhanced-goals-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.goal-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.goal-card.completed {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.goal-card.completed .text-body2 {
  color: rgba(255, 255, 255, 0.9) !important;
}

.goal-card.completed .text-grey-6 {
  color: rgba(255, 255, 255, 0.7) !important;
}

.auto-allocation-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
}

.achievement-card {
  border-radius: 12px;
  transition: transform 0.2s;
}

.achievement-card:hover {
  transform: translateY(-2px);
}

.priority-item {
  border-radius: 8px;
  margin-bottom: 4px;
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
