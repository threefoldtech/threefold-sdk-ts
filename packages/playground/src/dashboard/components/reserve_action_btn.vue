<template>
  <container>
    <v-dialog v-model="openUnreserveDialog" max-width="600" class="custom-dialog" attach="#modals">
      <v-card>
        <v-card-title class="pt-4">
          <span style="display: flex; align-items: center">
            <v-icon class="mr-2" color="warning">mdi-alert</v-icon>
            Unreserve this dedicated node?
          </span>
        </v-card-title>
        <v-divider />
        <v-card-text>This will free up the node for others on the chain</v-card-text>
        <v-card-actions class="justify-end mb-1 mr-2">
          <v-btn color="anchor" @click="openUnreserveDialog = false">Close</v-btn>
          <v-btn color="error" @click="unReserveNode" :loading="loadingUnreserveNode">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-btn
      :loading="loadingReserveNode"
      v-if="!reserved"
      :disabled="disableButton || hasInsufficientBalance"
      @click.stop="reserveNode"
      color="primary"
    >
      Reserve
    </v-btn>
    <span v-if="!reserved" class="ml-2">
      <v-tooltip text="You must acquire a minimum of 2 TFTs in order to reserve any node." location="bottom">
        <template #activator="{ props }">
          <VIcon icon="mdi-information-outline" v-bind="props" />
        </template>
      </v-tooltip>
    </span>
    <v-btn
      size="small"
      color="error"
      :loading="loadingUnreserveBtn"
      :disabled="disableButton"
      v-if="reserved"
      @click.stop="removeReserve"
    >
      Unreserve
    </v-btn>
  </container>
</template>

<script lang="ts">
import type { GridClient } from "@threefold/grid_client";
import type { GridNode } from "@threefold/gridproxy_client";
import { InsufficientBalanceError } from "@threefold/types";
import { computed, onMounted, type PropType, ref, watch } from "vue";

import { useProfileManager } from "@/stores";
import { createCustomToast, ToastType } from "@/utils/custom_toast";
import { notifyDelaying } from "@/utils/notifications";

import { useProfileManagerController } from "../../components/profile_manager_controller.vue";
import { useGrid } from "../../stores";
import { updateGrid } from "../../utils/grid";

export default {
  name: "ReserveBtn",
  props: {
    node: {
      required: true,
      type: Object as PropType<GridNode>,
    },
  },
  setup(props, { emit }) {
    const profileManager = useProfileManager();
    const profileManagerController = useProfileManagerController();
    const profile = computed(() => {
      return profileManager.profile ?? null;
    });
    const openUnreserveDialog = ref(false);
    const loadingUnreserveNode = ref(false);
    const loadingUnreserveBtn = ref(false);
    const loadingReserveNode = ref(false);
    const disableButton = ref(false);
    const hasInsufficientBalance = ref(false);
    const balance = profileManagerController.balance;
    const freeBalance = computed(() => balance.value?.free ?? 0);
    const gridStore = useGrid();
    const grid = gridStore.client as GridClient;
    const reserved = ref(true);
    watch(
      freeBalance,
      (newFreeBalance, _) => {
        if (newFreeBalance < 2) {
          hasInsufficientBalance.value = true;
        } else {
          hasInsufficientBalance.value = false;
        }
      },
      { immediate: true },
    );

    function removeReserve() {
      openUnreserveDialog.value = true;
    }

    onMounted(() => {
      if (props.node.rentedByTwinId == 0) reserved.value = false;
    });

    async function unReserveNode() {
      loadingUnreserveNode.value = true;
      try {
        updateGrid(grid, { projectName: "" });
        createCustomToast(`Verify contracts for node ${props.node.nodeId}`, ToastType.info);

        const result = (await grid?.contracts.getActiveContracts({ nodeId: +props.node.nodeId })) as any;
        if (result.length > 0) {
          createCustomToast(`node ${props.node.nodeId} has active contracts`, ToastType.info);
          loadingUnreserveNode.value = false;
          openUnreserveDialog.value = false;
        }

        createCustomToast(`unreserving node ${props.node.nodeId}`, ToastType.info);
        await grid?.nodes.unreserve({ nodeId: +props.node.nodeId });
        createCustomToast(`Transaction succeeded node ${props.node.nodeId} Unreserved`, ToastType.success);
        loadingUnreserveNode.value = false;
        openUnreserveDialog.value = false;
        loadingUnreserveBtn.value = true;
        notifyDelaying();
        disableButton.value = true;
        setTimeout(() => {
          disableButton.value = false;
          loadingUnreserveBtn.value = false;
          emit("updateTable");
          reserved.value = false;
        }, 20000);
      } catch (e) {
        if (e instanceof InsufficientBalanceError) {
          createCustomToast(`Can't delete rent contract due to Insufficient balance`, ToastType.danger);
        } else {
          console.log(e);
          createCustomToast("Failed to delete rent contract.", ToastType.danger);
        }
      } finally {
        loadingUnreserveNode.value = false;
        openUnreserveDialog.value = false;
      }
    }

    async function reserveNode() {
      if (!profile.value) {
        createCustomToast("Please Login first to continue.", ToastType.danger);
      }
      try {
        loadingReserveNode.value = true;
        disableButton.value = true;
        createCustomToast("Transaction Submitted", ToastType.info);
        await grid?.nodes.reserve({ nodeId: +props.node.nodeId });
        createCustomToast(`Transaction succeeded node ${props.node.nodeId} Reserved`, ToastType.success);
        notifyDelaying();
        setTimeout(() => {
          emit("updateTable");
          reserved.value = true;
        }, 20000);
      } catch (e) {
        if (e instanceof InsufficientBalanceError) {
          createCustomToast(`Can't create rent contract due to Insufficient balance`, ToastType.danger);
        } else {
          console.log(e);
          createCustomToast("Failed to create rent contract.", ToastType.danger);
        }
      } finally {
        disableButton.value = false;
        loadingReserveNode.value = false;
      }
    }

    return {
      openUnreserveDialog,
      loadingUnreserveNode,
      loadingReserveNode,
      unReserveNode,
      reserveNode,
      removeReserve,
      disableButton,
      loadingUnreserveBtn,
      profile,
      hasInsufficientBalance,
      reserved,
    };
  },
};
</script>

<style scoped>
.v-btn.text-error:hover > .v-btn__overlay {
  opacity: 0;
}
</style>
