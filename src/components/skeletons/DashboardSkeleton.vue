<template>
  <div class="dashboard-skeleton">
    <!-- Header skeleton -->
    <div class="dashboard-header q-pa-md">
      <div class="row items-center justify-between">
        <div>
          <q-skeleton type="text" width="180px" height="32px" class="q-mb-xs" animation="wave" />
          <q-skeleton type="text" width="220px" height="20px" animation="wave" />
        </div>
        <div class="text-right">
          <q-skeleton type="text" width="120px" height="28px" class="q-mb-xs" animation="wave" />
          <q-skeleton type="text" width="80px" height="16px" animation="wave" />
          <div class="q-mt-sm">
            <q-skeleton type="rect" width="120px" height="40px" animation="wave" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="row q-col-gutter-md q-pa-md">
      <div class="col-12 col-sm-4" v-for="i in 3" :key="i">
        <q-card class="stat-card">
          <q-card-section class="text-center">
            <q-skeleton type="circle" size="2rem" class="q-mx-auto q-mb-sm" animation="wave" />
            <q-skeleton type="text" width="90px" height="24px" class="q-mx-auto q-mb-sm" animation="wave" />
            <q-skeleton type="text" width="100px" height="16px" class="q-mx-auto" animation="wave" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row q-col-gutter-md q-pa-md">
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section>
            <q-skeleton type="text" width="240px" height="20px" class="q-mx-auto q-mb-md" animation="wave" />
            <q-skeleton type="rect" height="220px" animation="wave" />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section>
            <q-skeleton type="text" width="200px" height="20px" class="q-mx-auto q-mb-md" animation="wave" />
            <q-skeleton type="rect" height="220px" animation="wave" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Cash Flow Forecast skeleton -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <q-skeleton type="text" width="200px" height="22px" animation="wave" />
            <q-skeleton type="rect" width="160px" height="36px" animation="wave" />
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3" v-for="i in 4" :key="i">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <q-skeleton type="text" width="70px" height="18px" class="q-mx-auto q-mb-sm" animation="wave" />
                  <q-skeleton type="text" width="80px" height="24px" class="q-mx-auto q-mb-sm" animation="wave" />
                  <q-skeleton type="text" width="60px" height="14px" class="q-mx-auto" animation="wave" />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Recent Transactions skeleton -->
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <q-skeleton type="text" width="180px" height="22px" class="q-mb-md" animation="wave" />
          <q-list>
            <q-item v-for="i in 5" :key="i" class="q-px-none">
              <q-item-section avatar>
                <q-skeleton type="QAvatar" size="32px" animation="wave" />
              </q-item-section>
              <q-item-section>
                <q-skeleton type="text" width="140px" height="18px" animation="wave" />
                <q-skeleton type="text" width="100px" height="14px" class="q-mt-xs" animation="wave" />
              </q-item-section>
              <q-item-section side>
                <q-skeleton type="text" width="70px" height="18px" animation="wave" />
              </q-item-section>
            </q-item>
          </q-list>
          <div class="text-center q-mt-md">
            <q-skeleton type="rect" width="200px" height="36px" class="q-mx-auto" animation="wave" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dashboard-skeleton .stat-card,
.dashboard-skeleton .chart-card {
  border-radius: 12px;
}
</style>
