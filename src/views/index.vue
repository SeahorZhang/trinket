<script setup lang="ts">
import Header from "@/components/header.vue";
</script>

<template>
  <Header />
  <div class="flex-1 pt-20 bg-amber-200">
    <RouterView />
  </div>
</template>
