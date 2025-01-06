<template>
  <div>
    <input-validator
      :rules="[
        validators.required('Name is required.'),
        validators.isLowercase('Name should consist of lowercase letters only.'),
        validators.IsAlphanumericExpectUnderscore('Name should consist of letters ,numbers and underscores only.'),
        (name: string) => validators.isAlpha('Name must start with an alphabetical character.')(name[0]),
        validators.minLength('Name must be at least 2 characters.', 2),
        validators.maxLength('Name cannot exceed 35 characters.', 35),
      ]"
      :value="$props.modelValue.name"
      #="{ props }"
    >
      <input-tooltip tooltip="Node name.">
        <v-text-field label="Name" v-model="$props.modelValue.name" v-bind="props" />
      </input-tooltip>
    </input-validator>

    <SelectSolutionFlavor
      v-model="$props.modelValue.solution"
      :small="{ cpu: 1, memory: 2, disk: 50 }"
      :medium="{ cpu: 2, memory: 4, disk: 100 }"
    />

    <Networks
      required
      :ipv4="$props.modelValue.ipv4"
      v-model:ipv6="$props.modelValue.ipv6"
      v-model:planetary="$props.modelValue.planetary"
      v-model:mycelium="$props.modelValue.mycelium"
      v-model:wireguard="$props.modelValue.wireguard"
    />

    <input-tooltip inline tooltip="Click to know more about dedicated machines." :href="manual.dedicated_machines">
      <v-switch color="primary" inset label="Dedicated" v-model="$props.modelValue.dedicated" hide-details />
    </input-tooltip>
    <input-tooltip inline tooltip="Renting capacity on certified nodes is charged 25% extra.">
      <v-switch color="primary" inset label="Certified" v-model="$props.modelValue.certified" hide-details />
    </input-tooltip>

    <TfSelectionDetails
      :selected-machines="selectedMachines"
      :nodes-lock="nodesLock"
      :filters="{
        ipv4: $props.modelValue.ipv4,
        ipv6: $props.modelValue.ipv6,
        certified: $props.modelValue.certified,
        dedicated: $props.modelValue.dedicated,
        cpu: $props.modelValue.solution?.cpu,
        solutionDisk: $props.modelValue.solution?.disk,
        memory: $props.modelValue.solution?.memory,
        rootFilesystemSize,
      }"
      v-model="$props.modelValue.selectionDetails"
    />
  </div>
</template>

<script lang="ts">
import { calculateRootFileSystem } from "@threefold/grid_client";
import type AwaitLock from "await-lock";
import { computed, type PropType } from "vue";

import type { SelectedMachine } from "@/types/nodeSelector";
import { manual } from "@/utils/manual";

import Networks from "../components/networks.vue";
import type { CaproverWorker } from "../types";
import { generateName } from "../utils/strings";
import SelectSolutionFlavor from "./select_solution_flavor.vue";

export function createWorker(name: string = generateName({ prefix: "wr" })): CaproverWorker {
  return {
    name,
    ipv4: true,
    ipv6: false,
    planetary: false,
    wireguard: false,
    mycelium: true,
  };
}

function toMachine(rootFilesystemSize: number, worker?: CaproverWorker): SelectedMachine | undefined {
  if (!worker || !worker.selectionDetails || !worker.selectionDetails.node) {
    return undefined;
  }

  return {
    nodeId: worker.selectionDetails.node.nodeId,
    cpu: worker.solution?.cpu ?? 0,
    memory: worker.solution?.memory ?? 0,
    disk: (worker.solution?.disk ?? 0) + (rootFilesystemSize ?? 0),
    farmId: worker.selectionDetails.node.farmId,
    publicIp: true,
  };
}

export default {
  name: "CaproverWorker",
  components: { SelectSolutionFlavor, Networks },
  props: {
    modelValue: {
      type: Object as PropType<CaproverWorker>,
      required: true,
    },
    otherWorkers: {
      type: Array as PropType<CaproverWorker[]>,
      default: () => [],
    },
    nodesLock: Object as PropType<AwaitLock>,
  },
  setup(props) {
    const rootFilesystemSize = computed(() => {
      const { cpu = 0, memory = 0 } = props.modelValue.solution || {};
      return calculateRootFileSystem({
        CPUCores: cpu,
        RAMInMegaBytes: memory,
      });
    });

    const selectedMachines = computed(() => {
      return props.otherWorkers.reduce((res, worker) => {
        const machine = toMachine(rootFilesystemSize.value, worker);
        if (machine) {
          res.push(machine);
        }
        return res;
      }, [] as SelectedMachine[]);
    });

    return { rootFilesystemSize, manual, selectedMachines };
  },
};
</script>
