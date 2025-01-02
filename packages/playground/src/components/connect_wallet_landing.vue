<template>
  <div>
    <v-alert color="warning" variant="tonal"
      ><v-icon size="24" class="pb-1">mdi-alert-circle</v-icon>
      Connect your TFChain
      <a class="app-link" @click="$emit('openProfile')">Wallet</a>
      to view {{ pageTitle }}
    </v-alert>
    <v-container class="custom-container">
      <h4 class="text-center text-h5 text-lg-h4 my-4">A Co-Owned Global Sovereign Internet</h4>
      <v-container class="d-flex justify-center">
        <p class="home_text text-center text-subtitle w-75 sm-w-auto">
          ThreeFold is
          <strong
            >a peer-to-peer open-source Internet platform that connects users directly with local Internet
            capacity</strong
          >
          (storage, compute, and network) provided by farmers. A decentralized sovereign alternative to today’s
          centralized Internet model.
          <a href="https://threefold.io/" target="_blank" class="app-link">Find More!</a>
        </p>
      </v-container>

      <div
        :style="{
          backgroundImage: 'url(' + baseUrl + 'images/live-and-operational-background2.png)',
          padding: '20px',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          minHeight: '600px',
        }"
      >
        <div class="d-flex justify-center mb-4">
          <h4 class="text-center text-h5">Live and Operational</h4>
        </div>
        <v-container fluid>
          <div class="d-flex flex-column">
            <v-row class="justify-center items-center mx-sm-2 mx-lg-10">
              <v-col lg="3" md="6" sm="12" v-for="s in stats" :key="s.value" class="stats px-8">
                <v-card class="mt-2">
                  <v-img
                    cover
                    width="100"
                    class="mx-auto"
                    :src="baseUrl + 'images/icons/live-and-operational/' + s.image"
                  />
                  <v-card-text class="card_stats">
                    <p class="text-center tf-header font-weight-regular mb-2">
                      {{ s.value }}
                    </p>
                    <p class="text-center text-subtitle-1 font-weight-light sub-header">
                      {{ s.label }}
                    </p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-container>
        <div class="d-flex justify-center mt-5">
          <v-btn variant="elevated" target="_blank" :href="statsUrl"> Explore ThreeFold Grid Capacity </v-btn>
        </div>
      </div>
      <div class="text-center my-8">
        <h4 class="text-h5 mb-4">The <strong>Layer Zero</strong> for a Decentralized World</h4>
        <p class="home_text w-75 mx-auto text-subtitle-1">
          Anything that runs on Linux can run on ThreeFold – with more security, more sustainably, and in true
          decentralization. The ThreeFold Grid can support workloads from Blockchain to Web2 to Web3 to IoT and
          Metaverse and more.
        </p>
        <div class="d-flex justify-center align-center flex-wrap my-4">
          <v-btn variant="elevated" class="mr-2" target="_blank" :href="MANUAL_URL"> Learn about the grid </v-btn>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "vuetify";

import { DashboardRoutes } from "@/router/routes";
import { useStatsStore } from "@/stores/stats";
export default {
  name: "ConnectWalletLanding",
  setup() {
    const theme = useTheme();
    const baseUrl = import.meta.env.BASE_URL;
    const route = useRoute();
    const pageTitle = computed(() => route.meta.title);
    const statsStore = useStatsStore();
    return {
      theme,
      pageTitle,
      DashboardRoutes,
      stats: computed(() => statsStore.stats),
      statsUrl: window.env.STATS_URL,
      baseUrl,
    };
  },
};
</script>

<style scoped>
.tf-header {
  font-size: 1rem;
}
.card_stats {
  padding: 1rem 0.4rem;
}

@media only screen and (max-width: 600px) {
  .v-col {
    flex-basis: auto !important;
  }

  .home_text {
    width: auto !important;
  }
}

@media (max-width: 375px) {
  .v-container {
    padding: 4px;
  }
}
</style>
