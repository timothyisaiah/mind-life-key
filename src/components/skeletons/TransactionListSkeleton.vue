<template>
  <div class="transaction-list-skeleton">
    <q-skeleton type="text" width="160px" height="22px" class="q-mb-md" animation="wave" />
    <q-list separator>
      <q-item v-for="i in rowCount" :key="i" class="transaction-item">
        <q-item-section avatar>
          <q-skeleton type="QAvatar" size="40px" animation="wave" />
        </q-item-section>
        <q-item-section>
          <q-skeleton type="text" width="180px" height="18px" animation="wave" />
          <q-skeleton type="text" width="120px" height="14px" class="q-mt-xs" animation="wave" />
        </q-item-section>
        <q-item-section side>
          <q-skeleton type="text" width="80px" height="20px" animation="wave" />
        </q-item-section>
        <q-item-section side>
          <div class="row q-gutter-xs">
            <q-skeleton type="rect" width="36px" height="36px" animation="wave" />
            <q-skeleton type="rect" width="36px" height="36px" animation="wave" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
defineProps({
  rowCount: {
    type: Number,
    default: 8
  }
})
</script>
