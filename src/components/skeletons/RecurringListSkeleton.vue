<template>
  <div class="recurring-list-skeleton">
    <q-skeleton type="text" width="280px" height="22px" class="q-mb-md" animation="wave" />
    <q-list separator>
      <q-item v-for="i in rowCount" :key="i">
        <q-item-section avatar>
          <q-skeleton type="QAvatar" size="40px" animation="wave" />
        </q-item-section>
        <q-item-section>
          <q-skeleton type="text" width="160px" height="18px" animation="wave" />
          <q-skeleton type="text" width="200px" height="14px" class="q-mt-xs" animation="wave" />
        </q-item-section>
        <q-item-section side>
          <q-skeleton type="text" width="70px" height="20px" animation="wave" />
          <q-skeleton type="rect" width="60px" height="24px" class="q-mt-sm" animation="wave" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
defineProps({
  rowCount: {
    type: Number,
    default: 6
  }
})
</script>
