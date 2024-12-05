import { defineStore } from "pinia";
import { computed } from "vue";

import { useAsync } from "@/hooks";
const url = window.env.STATS_URL || "https://stats.grid.tf";

export const useStatsStore = defineStore("stats-store", () => {
  const res = useAsync(() => fetch(url + "/api/stats-summary").then(resp => resp.json()), {
    init: true,
  });
  const data = computed(() => res.value.data);
  const stats = computed(() => [
    {
      label: "Capacity",
      value: data.value?.ssd,
      image: "capacity.png",
    },
    {
      label: "Nodes",
      value: data.value?.nodes,
      image: "nodes.png",
    },
    {
      label: "Countries",
      value: data.value?.countries,
      image: "countries.png",
    },
    {
      label: "Cores",
      value: data.value?.cores,
      image: "cores.png",
    },
  ]);
  return {
    data,
    stats,
  };
});
