<script setup lang="ts">
const routes = [{ name: "logo3D", path: "/logo3D" }];
</script>

<template>
  <div class="flex items-center justify-center py-6 bg-amber-100">
    <nav
      class="inline-flex items-center px-3 ring-1 ring-zinc-900/5 dark:ring-zinc-100/10 rounded-full bg-gradient-to-b from-zinc-50/70 to-white/70 dark:from-zinc-900/70 dark:to-zinc-800/70 backdrop-blur backdrop-saturate-200 shadow-lg shadow-zinc-800/5"
    >
      <RouterLink
        v-for="item in routes"
        :key="item.path"
        :to="item.path"
        class="py-2 px-3 font-medium text-sm hover:text-primary transition-colors"
        active-class="text-primary"
      >
        {{ item.name }}
      </RouterLink>
    </nav>
  </div>
</template>
