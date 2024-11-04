<template>
  <input-tooltip v-if="value !== null" inline :tooltip="tooltipText">
    <v-switch
      hide-details
      color="primary"
      inset
      :label="label"
      :model-value="value"
      @update:model-value="callEmitFunction($event ?? false)"
      :readonly="readonly"
      :style="{ opacity: readonly ? 0.5 : 1 }"
    />
  </input-tooltip>
</template>

<script lang="ts">
import { computed, type PropType } from "vue";

export default {
  name: "NetworkItem",
  props: {
    tooltipText: { type: String, required: true },
    label: { type: String, required: true },
    value: Boolean as PropType<boolean | null | undefined>,
    emitFunction: Function as PropType<any>,
  },
  setup(props) {
    const readonly = computed(() => typeof props.emitFunction !== "function");
    function callEmitFunction(value?: boolean): void {
      if (typeof props.emitFunction === "function") {
        props.emitFunction(value);
      }
    }

    return { readonly, callEmitFunction };
  },
};
</script>
