<template>
  <div class="border px-4 pb-4 rounded position-relative mt-2">
    <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-silo</v-icon>
      <v-card-title class="pa-0">Farms</v-card-title>
    </v-card>
    <template v-if="showKYCError">
      <VAlert variant="tonal" type="error" class="mt-4">
        <template #prepend>
          <v-icon icon="mdi-shield-remove"></v-icon>
        </template>
        <div class="d-flex justify-space-between align-baseline">
          <div>To start farming, KYC verification is required. Please complete the process to proceed.</div>
          <v-btn text="Verify now" size="small" color="error" @click="kycDialog = true" :loading="kycDialogLoading" />
        </div>
      </VAlert>
      <div class="d-flex justify-content-center align-items-center" style="height: 100%; width: 100%">
        <v-img class="d-inline-block mx-auto" :src="baseURL + 'images/kyc.png'" style="max-width: 40%"></v-img>
      </div>
    </template>
    <template v-else>
      <CreateFarm class="mt-4" @farm-created="handleFarmCreated" />
      <UserFarms :ref="el => (userFarms = el)" :reloadFarms="farmsReload" />
      <UserNodes />
    </template>
  </div>
  <KycVerifier
    v-if="kycDialog"
    :loading="kycDialogLoading"
    @update:loading="kycDialogLoading = $event"
    :moduleValue="kycDialog"
    @update:moduleValue="kycDialog = $event"
  />
</template>

<script lang="ts">
import { KycStatus } from "@threefold/grid_client";
import { computed, ref, watch } from "vue";

import KycVerifier from "@/components/KycVerifier.vue";
import { useKYC } from "@/stores/kyc";

import CreateFarm from "./components/create_farm.vue";
import UserFarms from "./components/user_farms.vue";
import UserNodes from "./components/user_nodes.vue";
export default {
  name: "DashboardFarms",
  components: {
    KycVerifier,
    UserNodes,
    UserFarms,
    CreateFarm,
  },
  setup() {
    const baseURL = import.meta.env.BASE_URL;

    const farmsReload = ref<boolean>(false);
    const userFarms = ref();
    const kyc = useKYC();
    const kycDialog = ref(false);
    const kycDialogLoading = ref(false);
    console.log("kyc", kyc);

    const showKYCError = computed(() => kyc.status !== KycStatus.verified);
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
      baseURL,
      farmsReload,
      handleFarmCreated,
      userFarms,
      showKYCError,
      kycDialog,
      kycDialogLoading,
    };
  },
};
</script>
