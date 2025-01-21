<template>
  <div>
    <div class="border px-4 pb-4 rounded position-relative mt-2">
      <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
        <v-icon size="30" class="pr-3" color="white">mdi-chart-scatter-plot</v-icon>
        <v-card-title class="pa-0">Statistics</v-card-title>
      </v-card>
      <div class="text-center">
        <v-row align="center" justify="center">
          <v-col cols="12" sm="6" md="4">
            <div class="d-flex my-6 align-center justify-center">
              <v-progress-circular indeterminate v-if="loading" />
            </div>
          </v-col>
        </v-row>
      </div>
      <v-card class="d-flex">
        <v-row align="center" class="pa-5">
          <v-col color="red" v-if="failed">
            <v-alert type="error" variant="tonal">
              Failed to get stats data after 3 attempts, Feel free to contact the support team or try again later.
              <v-btn @click="fetchData" color="transparent">
                <v-icon> mdi-refresh</v-icon>
              </v-btn>
            </v-alert>
          </v-col>
          <v-col cols="12" md="8">
            <tf-map r="125" g="227" b="200" :nodes="nodesDistribution" />
          </v-col>
          <v-col v-if="Istats.length !== 0" cols="12" md="4">
            <v-row>
              <v-col v-for="item of Istats" :key="item.title" :cols="6" :md="6" class="d-flex flex-grow-1">
                <StatisticsCard :item="item" />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NodeStatus, type Stats as GridProxyStats } from "@threefold/gridproxy_client";
import { onMounted, ref } from "vue";

import formatResourceSize, { formatNumberWithCommas } from "@/utils/format_resource_size";

import { gridProxyClient } from "../clients";
import StatisticsCard from "../components/statistics_card.vue";
import type { IStatistics as IStatistics } from "../types";

type Stats = GridProxyStats & { gpus: number };

const loading = ref(true);
const failed = ref(false);

const Istats = ref<IStatistics[]>([]);
const nodesDistribution = ref<string>("");

let stats: Stats | null | undefined = null;

function mergeNodeDistribution(stats: Stats["nodesDistribution"][]) {
  const keys = new Set(stats.map(obj => Object.keys(obj)).flat());

  return Array.from(keys).reduce((res, key) => {
    res[key] = 0;
    stats.forEach(country => {
      res[key] += country[key] ?? 0;
    });

    if (key === "The Netherlands" && res["The Netherlands"]) {
      res["Netherlands"] = res["The Netherlands"];
      delete res["The Netherlands"];
    }

    return res;
  }, {} as { [key: string]: number });
}

function mergeStatsData(stats: Stats[]): Stats {
  const res = stats[0];
  for (let i = 1; i < stats.length; i++) {
    res.accessNodes += stats[i].accessNodes;
    res.dedicatedNodes += stats[i].dedicatedNodes;
    res.gateways += stats[i].gateways;
    res.nodes += stats[i].nodes;
    res.totalCru += stats[i].totalCru;
    res.totalHru += stats[i].totalHru;
    res.totalMru += stats[i].totalMru;
    res.totalSru += stats[i].totalSru;
    res.gpus += stats[i].gpus;
    res.nodesDistribution = mergeNodeDistribution([res.nodesDistribution, stats[i].nodesDistribution]);
    res.countries = Object.keys(res.nodesDistribution).length;
  }

  return res;
}
const fetchStats = async () => {
  let retryCount = 0;

  const fetchDataWithRetry = async (): Promise<Stats | undefined> => {
    try {
      loading.value = true;
      failed.value = false;
      const upStats = await gridProxyClient.stats.get({ status: NodeStatus.Up });
      const standbyStats = await gridProxyClient.stats.get({ status: NodeStatus.Standby });
      return mergeStatsData([upStats, standbyStats]);
    } catch (error) {
      if (retryCount < 3) {
        console.log("Error fetching stats:", error);
        retryCount++;
        console.log(`Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchDataWithRetry();
      } else {
        loading.value = false;
        failed.value = true;
      }
    }
  };

  return fetchDataWithRetry();
};

const fetchData = async () => {
  try {
    stats = await fetchStats();
    if (!loading.value || stats != null) {
      nodesDistribution.value = JSON.stringify(stats!.nodesDistribution);
      Istats.value = [
        { data: stats!.nodes, title: "Nodes Online", icon: "mdi-laptop" },
        { data: stats!.dedicatedNodes, title: "Dedicated Machines", icon: "mdi-resistor-nodes" },
        { data: stats!.farms, title: "Farms", icon: "mdi-tractor" },
        { data: stats!.countries, title: "Countries", icon: "mdi-earth" },
        { data: stats!.totalCru, title: "CPUs", icon: "mdi-cpu-64-bit" },
        { data: formatNumberWithCommas(stats!.totalSru), title: "SSD Storage", icon: "mdi-nas" },
        { data: formatResourceSize(stats!.totalMru), title: "RAM", icon: "mdi-memory" },
        { data: stats!.gpus, title: "GPUs", icon: "mdi-memory" },
        { data: stats!.accessNodes, title: "Access Nodes", icon: "mdi-gate" },
        { data: stats!.gateways, title: "Gateways", icon: "mdi-boom-gate-outline" },
        { data: stats!.twins, title: "Twins", icon: "mdi-brain" },
        { data: stats!.publicIps, title: "Public IPs", icon: "mdi-access-point" },
        { data: stats!.contracts, title: "Contracts", icon: "mdi-file-document-edit-outline" },
        { data: stats!.workloads_number, title: "Number of workloads", icon: "mdi-state-machine" },
      ];

      loading.value = false;
    }
  } catch (error) {
    console.error("Error in fetchData:", error);
  }
};

onMounted(fetchData);
</script>

<style scoped>
@media (max-width: 1280px) {
  .main_divider {
    visibility: hidden;
  }
}
</style>
