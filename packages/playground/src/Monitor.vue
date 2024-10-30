<template>
  <template v-if="!loadingApp">
    <App />
  </template>
</template>

<script lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";

import { setGlobalEnv } from "./config";

export default {
  name: "AppMonitor",
  components: {
    App: defineAsyncComponent(() => import("./App.vue")),
  },
  setup() {
    const loadingApp = ref(true);
    onMounted(async () => {
      if (await setGlobalEnv()) {
        window.$$releaseMonitorLock();
        /* Load d-tabs before app */
        loadingApp.value = false;
      }
    });
    return { loadingApp };
  },
};
</script>
