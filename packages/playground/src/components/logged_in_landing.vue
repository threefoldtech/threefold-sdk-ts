<template>
  <v-container fluid>
    <v-row>
      <v-col lg="6" sm="12" class="border mt-3">
        <div>
          <div class="d-flex justify-center my-3">
            <h4 class="tf-header">Live and Operational</h4>
          </div>
          <div
            :style="{
              backgroundImage: 'url(' + baseUrl + 'images/live-and-operational-background.png)',

              backgroundSize: 'contain',
              backgroundPosition: 'center center',
              minHeight: '450px',
            }"
            class="responsive-div"
          />
          <div class="d-flex flex-column justify-center">
            <v-row>
              <v-col lg="3" xs="12" v-for="s in stats" :key="s.value" class="stats px-2">
                <v-card class="mt-4">
                  <v-img
                    cover
                    width="80"
                    class="mx-auto"
                    :src="baseUrl + 'images/icons/live-and-operational/' + s.image"
                  />
                  <v-card-text>
                    <p class="text-center tf-header font-weight-regular mb-2">
                      {{ s.value }}
                    </p>
                    <p class="text-center font-weight-light sub-header">
                      {{ s.label }}
                    </p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-col>
      <v-col lg="6" md="12" class="d-flex flex-wrap">
        <v-row>
          <v-col :lg="6" :md="6" :sm="12" v-for="card in cards" :key="card.path">
            <v-hover>
              <template v-slot:default="{ isHovering, props }">
                <v-card
                  class="p-1 border d-flex flex-wrap align-center h-100"
                  v-bind="props"
                  :class="isHovering ? 'card-opacity' : undefined"
                  @click="$router.push(card.path)"
                  height="100%"
                >
                  <v-card-title class="d-flex text-subtitle-1 align-baseline"
                    ><v-icon size="small" class="mr-2">{{ card.icon }}</v-icon
                    >{{ card.title }}</v-card-title
                  >
                  <v-card-text>{{ card.text }}</v-card-text>
                </v-card>
              </template>
            </v-hover>
          </v-col>
        </v-row>
        <v-row>
          <v-card class="d-flex justify-center align-center mt-3 py-2 border mx-3">
            <div class="text-center">
              <v-card-title class="text-subtitle">
                The <strong>Layer Zero</strong> for a Decentralized World
              </v-card-title>
              <p class="mx-auto px-4 text-subtitle-2" style="font-weight: 400">
                Anything that runs on Linux can run on ThreeFold – with more security, more sustainably, and in true
                decentralization. The ThreeFold Grid can support workloads from Blockchain to Web2 to Web3 to IoT and
                Metaverse and more.
              </p>

              <div class="d-flex justify-center align-center flex-wrap my-4">
                <v-btn variant="elevated" class="mr-2" target="_blank" :href="MANUAL_URL"> Learn about the grid </v-btn>
              </div>
            </div>
          </v-card>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "vuetify";

import { DashboardRoutes } from "@/router/routes";
import { useStatsStore } from "@/stores/stats";

import { useProfileManager } from "../stores";
export default {
  name: "LoggedInLanding",
  setup() {
    const theme = useTheme();
    const baseUrl = import.meta.env.BASE_URL;
    const route = useRoute();
    const $router = useRouter();
    const pageTitle = computed(() => route.meta.title);
    const profileManager = useProfileManager();
    const statsStore = useStatsStore();

    const cards = [
      {
        title: "Your Profile",
        icon: "mdi-account",
        text: "Your Profile includes your twin ID on the TFChain along with the account address and relay used. Click to view your profile details.",
        path: DashboardRoutes.TFChain.YourProfile,
      },
      {
        title: "Deploy Virtual Machines",
        icon: "mdi-television",
        text: "Deploy Full or Micro Virtual Machines from available images or custom ones on the Threefold Grid.",
        path: DashboardRoutes.Deploy.VirtualMachines,
      },
      {
        title: "Deploy Applications",
        icon: "mdi-lightbulb-on-outline",
        text: "Deploy from a wide range of in demand solutions such as Algorand, Funkwhale, Wordpress, Discourse and much more!",
        path: DashboardRoutes.Deploy.Applications,
      },
      {
        title: "Deploy Orchestrators",
        icon: "mdi-group",
        text: "Deploy Kubernetes clusters out of the box or Caprover app/database deployment & web server manager on the Threefold Grid.",
        path: DashboardRoutes.Deploy.Orchestrators,
      },
      {
        title: "Explore Grid Capacity",
        icon: "mdi-chart-scatter-plot",
        text: "View the CPU, SSD, RAM, HDD, GPU, Public IPs, Gateways capacity and more on the Threefold Grid.",
        path: DashboardRoutes.TFGrid.NodeStatistics,
      },
      {
        title: "Explore Grid Nodes",
        icon: "mdi-access-point",
        text: "Find nodes that fit your CPU, GPU, SSD, HDD and RAM capacity needs on the Threefold Grid.",
        path: DashboardRoutes.Deploy.NodeFinder,
      },
    ];
    return {
      theme,
      pageTitle,
      cards,
      profileManager,
      stats: computed(() => statsStore.stats),
      baseUrl,
      $router,
    };
  },
};
</script>

<style scoped>
.tf-header {
  font-size: 1rem;
}

.card-opacity {
  background-color: rgba(125, 227, 200, 0.12);
}
@media (max-width: 768px) {
  .responsive-div {
    min-height: 220px !important; /* Adjust height for mobile */
  }
}

@media only screen and (max-width: 600px) {
  .v-col {
    flex-basis: auto !important;
  }
  .v-card-title {
    white-space: normal !important;
  }
}
</style>
