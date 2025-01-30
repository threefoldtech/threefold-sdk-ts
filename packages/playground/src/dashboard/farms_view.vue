<template>
  <div class="border px-4 pb-4 rounded position-relative mt-2">
    <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-silo</v-icon>
      <v-card-title class="pa-0">Farms</v-card-title>
    </v-card>

    <CreateFarm class="mt-4" @farm-created="handleFarmCreated" />
    <UserFarms :ref="el => (userFarms = el)" :reloadFarms="farmsReload" />
    <UserNodes />
  </div>
</template>

<script lang="ts">
import { ref, watch } from "vue";

import CreateFarm from "./components/create_farm.vue";
import UserFarms from "./components/user_farms.vue";
import UserNodes from "./components/user_nodes.vue";
export default {
  name: "DashboardFarms",
  components: {
    UserNodes,
    UserFarms,
    CreateFarm,
  },
  setup() {
    const farmsReload = ref<boolean>(false);
    const userFarms = ref();
    function handleFarmCreated() {
      farmsReload.value = !farmsReload.value;
    }
    watch(
      () => farmsReload.value,
      () => {
        userFarms.value.reloadFarms = farmsReload.value;
      },
    );
    return {
      farmsReload,
      handleFarmCreated,
      userFarms,
    };
  },
};
</script>
