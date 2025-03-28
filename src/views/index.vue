<script setup lang="ts">
import Header from '@/components/header/index.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <Header />
  <div class="flex-1">
    <RouterView />
  </div>
</template>

