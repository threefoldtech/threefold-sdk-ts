<template>
  <card-details
    :iperf="true"
    :loading="loading"
    title="Network Speed Test"
    :items="IperfDetails"
    icon="mdi-speedometer"
    :error="errorMessage"
  />
</template>

<script lang="ts">
import type { GridNode } from "@threefold/gridproxy_client";
import { onMounted, type PropType, ref } from "vue";

import type { NodeDetailsCard } from "@/types";

import { useGrid } from "../../stores";
import formatResourceSize from "../../utils/format_resource_size";
import CardDetails from "./card_details.vue";

export default {
  name: "IPerfCard",
  components: { CardDetails },
  props: {
    node: {
      type: Object as PropType<GridNode>,
      required: true,
    },
  },

  setup(props) {
    const gridStore = useGrid();
    const loading = ref<boolean>(false);
    const IperfDetails = ref<NodeDetailsCard[]>();
    const errorMessage = ref("");
    onMounted(async () => {
      if (props.node.healthy) {
        errorMessage.value = "";
        try {
          loading.value = true;
          await getNodeIPerfCard();
        } catch (error) {
          console.log(error);
          errorMessage.value = "Failed to load IPerf details. Please try again later.";
        } finally {
          loading.value = false;
        }
      }
    });

    function format(speed: number) {
      return formatResourceSize(speed) + "/s" || "-";
    }
    function isIPv4(ip: string) {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipv4Regex.test(ip);
    }
    const getNodeIPerfCard = async (): Promise<NodeDetailsCard[]> => {
      const res = await gridStore.grid.zos.getNodeIPerfTest({ nodeId: props.node.nodeId });
      // filter the returned result to show node other than the one being tested against
      const array = res.result
        .filter(
          (node: any) => node.download_speed && node.upload_speed && !node.error && node.node_id !== props.node.nodeId,
        )
        .slice(0, 4)
        .map((node: any) => ({
          name: node.test_type.toLocaleUpperCase(),
          type: isIPv4(node.node_ip) ? "IPv4" : "IPv6",
          downloadSpeed: format(node.download_speed),
          uploadSpeed: format(node.upload_speed),
        }));
      if (array.length === 0) {
        console.error("Empty array returned from the IPerf test");
        throw new Error("Can't get the test results, please try again later.");
      }
      IperfDetails.value = array;
      return IperfDetails.value;
    };
    return {
      IperfDetails,
      loading,
      errorMessage,
    };
  },
};
</script>
