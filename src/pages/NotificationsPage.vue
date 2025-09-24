<template>
  <q-page class="notifications-page">
    <!-- Header -->
    <div class="page-header q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <h4 class="text-h4 text-weight-bold q-ma-none">Smart Notifications</h4>
          <p class="text-subtitle1 text-grey-6 q-ma-none">Stay on track with intelligent financial reminders
          </p>
        </div>
        <div class="row q-gutter-sm">
          <q-btn color="primary" icon="refresh" label="Refresh" @click="refreshNotifications" />
          <q-btn color="secondary" icon="settings" label="Settings" @click="showSettingsDialog" />
          <q-btn color="negative" icon="clear_all" label="Clear All" @click="clearAllNotifications"
            v-if="notifications.length > 0" />
        </div>
      </div>
    </div>

    <!-- Notification Summary -->
    <div class="q-pa-md" v-if="notifications.length > 0">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="notifications" size="2rem" color="primary" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold">{{ notifications.length }}</div>
              <div class="text-caption text-grey-6">Total Notifications</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="mark_email_unread" size="2rem" color="warning" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold">{{ unreadCount }}</div>
              <div class="text-caption text-grey-6">Unread</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="priority_high" size="2rem" color="negative" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold">{{ highPriorityCount }}</div>
              <div class="text-caption text-grey-6">High Priority</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-3">
          <q-card class="summary-card">
            <q-card-section class="text-center">
              <q-icon name="schedule" size="2rem" color="info" class="q-mb-sm" />
              <div class="text-h6 text-weight-bold">{{ billReminderCount }}</div>
              <div class="text-caption text-grey-6">Bill Reminders</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">All Notifications</div>
            <div class="row q-col-gutter-sm">
              <q-btn flat color="primary" label="Mark All Read" @click="markAllAsRead" v-if="unreadCount > 0" />
              <q-btn flat color="secondary" :label="showRead ? 'Hide Read' : 'Show Read'"
                @click="showRead = !showRead" />
            </div>
          </div>

          <div v-if="filteredNotifications.length === 0" class="text-center text-grey-6 q-py-xl">
            <q-icon name="notifications_off" size="4rem" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">No notifications</div>
            <div class="text-body2">You're all caught up! Check back later for new reminders.</div>
          </div>

          <div v-else>
            <q-list bordered separator>
              <q-item v-for="notification in filteredNotifications" :key="notification.id"
                :class="{ 'notification-unread': !notification.read }" class="notification-item">
                <q-item-section avatar>
                  <q-icon :name="notification.icon" :color="notification.color" size="1.5rem" />
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ notification.title }}</q-item-label>
                  <q-item-label caption class="text-body2">{{ notification.message }}</q-item-label>
                  <q-item-label caption class="text-caption text-grey-5">
                    {{ formatDate(notification.createdAt) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row q-col-gutter-xs">
                    <q-chip v-if="notification.priority >= 2"
                      :color="notification.priority === 3 ? 'negative' : 'warning'" text-color="white" size="sm"
                      :label="notification.priority === 3 ? 'High' : 'Medium'" />
                    <q-btn flat round icon="close" size="sm" @click="deleteNotification(notification.id)" />
                  </div>
                </q-item-section>

                <q-item-section side>
                  <div class="row q-col-gutter-xs">
                    <q-btn v-if="!notification.read" flat round icon="mark_email_read" size="sm"
                      @click="markAsRead(notification.id)" />
                    <q-btn v-if="notification.action" flat round
                      :icon="notification.action.type === 'navigate' ? 'arrow_forward' : 'info'" size="sm"
                      @click="handleNotificationAction(notification)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Notification Settings Dialog -->
    <q-dialog v-model="showSettingsDialogState" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Notification Settings</div>
        </q-card-section>
        <q-card-section>
          <q-form class="q-col-gutter-md">
            <div class="text-subtitle1 q-mb-sm">Notification Types</div>
            <q-toggle v-model="notificationSettings.billReminders" label="Bill Reminders" color="primary" />
            <q-toggle v-model="notificationSettings.budgetAlerts" label="Budget Alerts" color="primary" />
            <q-toggle v-model="notificationSettings.savingsEncouragement" label="Savings Encouragement"
              color="primary" />
            <q-toggle v-model="notificationSettings.achievementNotifications" label="Achievement Notifications"
              color="primary" />

            <q-separator class="q-my-md" />

            <div class="text-subtitle1 q-mb-sm">Alert Thresholds</div>
            <q-slider v-model="notificationSettings.reminderDays" :min="1" :max="7" :step="1" label label-always
              :label-value="`${notificationSettings.reminderDays} day${notificationSettings.reminderDays === 1 ? '' : 's'}`"
              color="primary" />
            <div class="text-caption text-center q-mt-sm">
              Days before bill due date to send reminder
            </div>

            <q-slider v-model="notificationSettings.budgetThreshold" :min="50" :max="100" :step="5" label label-always
              :label-value="`${notificationSettings.budgetThreshold}%`" color="warning" />
            <div class="text-caption text-center q-mt-sm">
              Budget percentage to trigger alert
            </div>

            <q-slider v-model="notificationSettings.savingsThreshold" :min="25" :max="75" :step="5" label label-always
              :label-value="`${notificationSettings.savingsThreshold}%`" color="positive" />
            <div class="text-caption text-center q-mt-sm">
              Goal progress percentage to trigger encouragement
            </div>
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showSettingsDialogState = false" />
          <q-btn color="primary" label="Save Settings" @click="saveSettings" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFinancialStore } from 'src/stores/financial'
import { formatDate } from 'src/utils/formatters'

const router = useRouter()
const financialStore = useFinancialStore()

// State
const showSettingsDialogState = ref(false)
const showRead = ref(false)

// Computed
const notifications = computed(() => financialStore.notifications)
const notificationSettings = computed(() => financialStore.notificationSettings)

const unreadCount = computed(() => financialStore.getUnreadNotificationsCount())
const highPriorityCount = computed(() => financialStore.getHighPriorityNotifications().length)
const billReminderCount = computed(() =>
  notifications.value.filter(n => n.type === 'bill_reminder' && !n.read).length
)

const filteredNotifications = computed(() => {
  if (showRead.value) {
    return notifications.value
  }
  return notifications.value.filter(n => !n.read)
})

// Methods
const refreshNotifications = () => {
  financialStore.generateSmartNotifications()
}

const markAsRead = (notificationId) => {
  financialStore.markNotificationAsRead(notificationId)
}

const markAllAsRead = () => {
  financialStore.markAllNotificationsAsRead()
}

const deleteNotification = (notificationId) => {
  financialStore.deleteNotification(notificationId)
}

const clearAllNotifications = () => {
  financialStore.clearAllNotifications()
}

const showSettingsDialog = () => {
  showSettingsDialogState.value = true
}

const saveSettings = () => {
  financialStore.updateNotificationSettings(notificationSettings.value)
  showSettingsDialogState.value = false
}

const handleNotificationAction = (notification) => {
  if (notification.action && notification.action.type === 'navigate') {
    router.push(notification.action.route)
  }
  markAsRead(notification.id)
}

onMounted(() => {
  financialStore.loadFromLocalStorage()
  refreshNotifications()
})
</script>

<style scoped>
.notifications-page {
  background-color: var(--q-background);
  color: var(--q-text-primary);
  min-height: 100vh;
}

.page-header {
  background: var(--q-primary);
  color: white;
}

.summary-card {
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.notification-item {
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.notification-unread {
  background-color: rgba(25, 118, 210, 0.05);
  border-left: 4px solid #1976d2;
}

.q-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
