import { defineStore } from "pinia";
import { ref } from "vue";

interface StateData {
  label: string;
  value: string;
  image: string;
}

export const useStatsStore = defineStore("stats-store", () => {
  const stats = ref<StateData[]>([]);
  window.$$monitorLock
    .then(() => fetch(window.env.STATS_URL + "/api/stats-summary"))
    .then(res => res.json())
    .then(data => {
      stats.value = [
        {
          label: "SSD Capacity",
          value: data.ssd,
          image: "capacity.png",
        },
        {
          label: "Nodes",
          value: data.nodes,
          image: "nodes.png",
        },
        {
          label: "Countries",
          value: data.countries,
          image: "countries.png",
        },
        {
          label: "Cores",
          value: data.cores,
          image: "cores.png",
        },
      ];
    })
    .catch(error => {
      console.error("Failed to fetch stats", error);
    });
  return { stats };
});
