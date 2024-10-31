<template>
  <div
    class="border px-4 pb-4 rounded position-relative mt-1"
    :class="{ 'pt-10': hasInfo, 'pt-3': !hasInfo }"
    ref="viewLayoutContainer"
  >
    <div
      :style="{ opacity: $vuetify.theme.name === 'dark' ? 'var(--v-medium-emphasis-opacity)' : '' }"
      v-if="$slots.description"
    />

    <div
      class="position-absolute pa-1 rounded-circle border"
      :style="{
        top: 0,
        right: '16px',
        transform: 'translateY(-50%)',
        zIndex: 99,
        backgroundColor: 'rgb(var(--v-theme-background))',
      }"
      v-if="hasInfo"
    >
      <AppInfo />
    </div>
    <template v-if="requireSSH && !ssh">
      <VAlert variant="tonal" type="error" class="mb-4">
        {{ title }} requires a public SSH key. You can generate or import it from the
        <router-link :to="DashboardRoutes.Deploy.SSHKey">SSH Keys</router-link> page.
      </VAlert>
    </template>
    <template v-if="requireKYC && kyc !== KycStatus.verified">
      <VAlert variant="tonal" type="error">
        <template #prepend>
          <v-icon icon="mdi-shield-remove"></v-icon>
        </template>
        <div class="d-flex justify-space-between align-baseline">
          <div>{{ title }} requires a KYC verification.</div>
          <v-btn
            text="Verify now"
            size="small"
            color="error"
            :loading="kycDialogLoading"
            @click="
              kycDialog = true;
              kycDialogLoading = true;
            "
          />
        </div>
      </VAlert>
    </template>
    <slot v-else :key="tick" />

    <div class="mt-4" v-if="$slots.list">
      <slot name="list" />
    </div>
  </div>
  <KycVerifier
    v-if="kycDialog"
    :loading="kycDialogLoading"
    @loaded="kycDialogLoading = false"
    :moduleValue="kycDialog"
    @update:moduleValue="kycDialog = $event"
  />
</template>

<script lang="ts">
import { KycStatus } from "@threefold/grid_client";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";

import { DashboardRoutes } from "@/router/routes";
import { useProfileManager } from "@/stores";
import { useKYC } from "@/stores/kyc";

import AppInfo from "./app_info.vue";
import KycVerifier from "./KycVerifier.vue";

export default {
  name: "ViewLayout",
  components: { AppInfo, KycVerifier },
  setup() {
    const route = useRoute();
    const profileManager = useProfileManager();
    const kyc = useKYC();
    const viewLayoutContainer = ref<HTMLElement>();
    const tick = ref(0);
    const kycDialog = ref(false);
    const kycDialogLoading = ref(false);
    function reRender(e: Event) {
      e.stopPropagation();
      tick.value++;
    }

    onMounted(() => {
      if (viewLayoutContainer.value) {
        viewLayoutContainer.value?.addEventListener("render:solution", reRender);
      }
    });

    onUnmounted(() => {
      viewLayoutContainer.value?.removeEventListener("render:solution", reRender);
    });

    return {
      title: computed(() => route.meta.title),
      hasInfo: computed(() => profileManager.profile && route.meta.info),
      ssh: computed(() => profileManager.profile?.ssh),
      kyc: computed(() => kyc.status),
      requireSSH: computed(() => route.meta.requireSSH),
      requireKYC: computed(() => route.meta.requireKYC || route.path.match(/\/applications\/.+$|\/orchestrators\/.+$/)),
      tick,
      viewLayoutContainer,
      DashboardRoutes,
      KycStatus,
      kycDialog,
      kycDialogLoading,
    };
  },
};
</script>
