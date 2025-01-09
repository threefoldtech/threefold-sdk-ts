<template>
  <weblet-layout
    ref="layout"
    :cpu="cpu"
    :memory="memory"
    :disk="storage + (type === 'indexer' ? 50 : 0)"
    :ipv4="ipv4"
    :dedicated="dedicated"
    :SelectedNode="selectionDetails?.node"
    :valid-filters="selectionDetails?.validFilters"
    title-image="images/icons/algorand.png"
  >
    <template #title>Deploy an Algorand Instance</template>
    <d-tabs :tabs="[{ title: 'Config', value: 'config' }]">
      <input-validator
        :value="name"
        :rules="[
          validators.required('Name is required.'),
          validators.IsAlphanumericExpectUnderscore('Name should consist of letters ,numbers and underscores only.'),
          (name: string) => validators.isAlpha('Name must start with an alphabetical character.')(name[0]),
          validators.minLength('Name must be at least 2 characters.', 2),
          validators.maxLength('Name cannot exceed 35 characters.', 35),
        ]"
        #="{ props }"
      >
        <input-tooltip tooltip="Instance name.">
          <v-text-field label="Name" v-model="name" v-bind="props" />
        </input-tooltip>
      </input-validator>
      <Networks
        v-model:mycelium="mycelium"
        v-model:planetary="planetary"
        v-model:ipv4="ipv4"
        v-model:ipv6="ipv6"
        v-model:wireguard="wireguard"
      />
      <AlgorandCapacity
        :network="network"
        :type="type"
        v-model:cpu.number="cpu"
        v-model:memory.number="memory"
        v-model:storage.number="storage"
      >
        <input-tooltip tooltip="Select a network to work against.">
          <v-select
            label="Network"
            :items="[
              { title: 'Mainnet', value: 'mainnet' },
              { title: 'Testnet', value: 'testnet' },
              { title: 'Betanet', value: 'betanet' },
              { title: 'Devnet', value: 'devnet' },
            ]"
            v-model="network"
          />
        </input-tooltip>

        <input-tooltip tooltip="Select node type.">
          <v-select
            label="Node Type"
            :items="[
              { title: 'Default', value: 'default' },
              { title: 'Relay', value: 'relay' },
              { title: 'Indexer', value: 'indexer' },
            ]"
            v-model="type"
          />
        </input-tooltip>
      </AlgorandCapacity>

      <input-tooltip inline tooltip="Click to know more about dedicated machines." :href="manual.dedicated_machines">
        <v-switch color="primary" inset label="Dedicated" v-model="dedicated" hide-details />
      </input-tooltip>

      <input-tooltip inline tooltip="Renting capacity on certified nodes is charged 25% extra.">
        <v-switch color="primary" inset label="Certified" v-model="certified" hide-details />
      </input-tooltip>

      <TfSelectionDetails
        :filters-validators="{
          cpu: { min: type === 'relay' || type === 'indexer' ? 4 : 2 },
          memory: { min: type === 'relay' || type === 'indexer' ? 8192 : 4096 },
          ssdDisks:
            type === 'relay'
              ? { min: 950, max: 1150 }
              : type === 'indexer'
              ? { min: 1500, max: 1700 }
              : { min: 100, max: 300 },
        }"
        :filters="{
          ipv4,
          ipv6,
          certified,
          dedicated,
          cpu,
          ssdDisks: [storage],
          solutionDisk: type === 'indexer' ? 50 : undefined,
          memory,
          rootFilesystemSize,
        }"
        v-model="selectionDetails"
      />

      <manage-ssh-deployemnt @selected-keys="updateSSHkeyEnv($event)" />
    </d-tabs>
    <template #footer-actions="{ validateBeforeDeploy }">
      <v-btn
        variant="elevated"
        class="text-primery px-10 py-3 h-auto text-subtitle-1"
        @click="validateBeforeDeploy(deploy)"
        text="Deploy"
      />
    </template>
  </weblet-layout>
</template>

<script lang="ts" setup>
import { computed, type Ref, ref, watch } from "vue";

import { manual } from "@/utils/manual";

import { useLayout } from "../components/weblet_layout.vue";
import { useGrid } from "../stores";
import { type Flist, ProjectName } from "../types";
import { deployVM } from "../utils/deploy_vm";
import { generateName } from "../utils/strings";

const layout = useLayout();
const lastRoundInput = ref();
const flist: Flist = {
  value: "https://hub.grid.tf/tf-official-apps/algorand-latest.flist",
  entryPoint: "/sbin/zinit init",
};
const name = ref(generateName({ prefix: "al" }));
const { ipv4, ipv6, planetary, mycelium, wireguard } = useNetworks();
const cpu = ref() as Ref<number>;
const memory = ref() as Ref<number>;
const storage = ref() as Ref<number>;
const network = ref("mainnet");
const type = ref("default");
const firstRound = ref(24000000);
const lastRound = ref(26000000);
const dedicated = ref(false);
const certified = ref(false);
const rootFilesystemSize = computed(() => storage.value);
const selectionDetails = ref<SelectionDetails>();
const selectedSSHKeys = ref("");
const gridStore = useGrid();
const grid = gridStore.client as GridClient;

watch(firstRound, () => lastRoundInput.value.validate(lastRound.value.toString()));

async function deploy() {
  layout.value.setStatus("deploy");

  const projectName = ProjectName.Algorand.toLowerCase() + "/" + name.value;

  try {
    layout.value?.validateSSH();
    updateGrid(grid, { projectName });

    await layout.value.validateBalance(grid!);

    const vm = await deployVM(grid!, {
      name: name.value,
      network: {
        addAccess: wireguard.value,
      },
      machines: [
        {
          name: name.value,
          cpu: cpu.value,
          memory: memory.value,
          flist: flist.value,
          entryPoint: flist.entryPoint,
          disks:
            type.value === "indexer"
              ? [
                  {
                    size: 50,
                    mountPoint: "/var/lib/docker",
                  },
                ]
              : [],
          rootFilesystemSize: rootFilesystemSize.value,
          publicIpv4: ipv4.value,
          publicIpv6: ipv6.value,
          mycelium: mycelium.value,
          planetary: planetary.value,
          nodeId: selectionDetails.value!.node!.nodeId,
          rentedBy: dedicated.value ? grid!.twinId : undefined,
          certified: certified.value,

          envs: [
            { key: "SSH_KEY", value: selectedSSHKeys.value },
            { key: "NETWORK", value: network.value },
            { key: "NODE_TYPE", value: type.value },
          ],
        },
      ],
    });

    layout.value.reloadDeploymentsList();
    layout.value.setStatus("success", "Successfully deployed an Algorand instance.");
    layout.value.openDialog(vm, deploymentListEnvironments.algorand);
  } catch (e) {
    layout.value.setStatus("failed", normalizeError(e, "Failed to deploy an Algorand instance."));
  }
}

function updateSSHkeyEnv(selectedKeys: string) {
  selectedSSHKeys.value = selectedKeys;
}
</script>

<script lang="ts">
import type { GridClient } from "@threefold/grid_client";

import AlgorandCapacity from "../components/algorand_capacity.vue";
import Networks, { useNetworks } from "../components/networks.vue";
import ManageSshDeployemnt from "../components/ssh_keys/ManageSshDeployemnt.vue";
import { deploymentListEnvironments } from "../constants";
import type { SelectionDetails } from "../types/nodeSelector";
import { updateGrid } from "../utils/grid";
import { normalizeError } from "../utils/helpers";

export default {
  name: "TfAlgorand",
  components: { AlgorandCapacity, Networks, ManageSshDeployemnt },
};
</script>
