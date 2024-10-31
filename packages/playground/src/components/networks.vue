<template>
  <input-tooltip ref="input" tooltip="Enable the network options to be able access your deployment">
    <v-expansion-panels variant="inset" class="mb-4">
      <v-expansion-panel expand-icon="mdi-menu-down" collapse-icon="mdi-menu-up" :disabled="$props.disabled">
        <v-expansion-panel-title>
          <v-card-title class="py-0" v-text="'Network'" />
          <v-icon v-if="error" color="warning" icon="mdi-alert-circle" class="ml-2" size="small" />
          <v-chip v-if="ipv4" variant="outlined" class="ml-2" text="IPV4" />
          <v-chip v-if="ipv6" variant="outlined" class="ml-2" text="IPV6" />
          <v-chip v-if="planetary" variant="outlined" class="ml-2" text="Planetary" />
          <v-chip v-if="mycelium" variant="outlined" class="ml-2" text="Mycelium" />
          <v-chip v-if="wireguard" variant="outlined" class="ml-2" text="Wireguard" />
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <NetworkItem
            tooltip-text="An Internet Protocol version 4 address that is globally unique and accessible over the internet."
            label="Public IPv4"
            :value="$props.ipv4"
            :emit-function="$attrs['onUpdate:ipv4']"
          />

          <NetworkItem
            tooltip-text="Public IPv6 is the next-generation Internet Protocol that offers an expanded address space to connect a vast number of devices."
            label="Public IPv6"
            :value="$props.ipv6"
            :emit-function="$attrs['onUpdate:ipv6']"
          />

          <NetworkItem
            tooltip-text="The Planetary Network is a distributed network infrastructure that spans across multiple regions and countries, providing global connectivity."
            label="Planetary Network"
            :value="$props.planetary"
            :emit-function="$attrs['onUpdate:planetary']"
          />

          <NetworkItem
            tooltip-text="Mycelium is an IPv6 overlay network. Each node that joins the overlay network will receive an overlay network IP."
            label="Mycelium"
            :value="$props.mycelium"
            :emit-function="$attrs['onUpdate:mycelium']"
          />

          <NetworkItem
            :tooltip-text="wireguardTooltip"
            label="Add Wireguard Access"
            :value="$props.wireguard"
            :emit-function="readonlyWireguard ? undefined : $attrs['onUpdate:wireguard']"
          />

          <v-alert
            v-if="error"
            class="my-2"
            type="warning"
            variant="tonal"
            text="You must enable at least one of network options."
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </input-tooltip>
</template>

<script lang="ts">
import { noop } from "lodash";
import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from "vue";

import { useForm, ValidatorStatus } from "@/hooks/form_validator";
import type { InputValidatorService } from "@/hooks/input_validator";

import NetworkItem from "./NetworkItem.vue";

interface CreateNetworksOptions {
  ipv4: boolean;
  ipv6: boolean;
  planetary: boolean;
  mycelium: boolean;
  wireguard: boolean;
}

export function useNetworks(options: Partial<CreateNetworksOptions> = {}) {
  return {
    ipv4: ref(options.ipv4 ?? false),
    ipv6: ref(options.ipv6 ?? false),
    planetary: ref(options.planetary ?? false),
    mycelium: ref(options.mycelium ?? true),
    wireguard: ref(options.wireguard ?? false),
  };
}

export default {
  name: "Network",
  components: { NetworkItem },
  props: {
    required: { type: Boolean, default: () => true },
    ipv4: { type: Boolean, default: () => null },
    ipv6: { type: Boolean, default: () => null },
    planetary: { type: Boolean, default: () => null },
    mycelium: { type: Boolean, default: () => null },
    wireguard: { type: Boolean, default: () => null },
    requireDomain: { type: Boolean, default: () => false },
    hasCustomDomain: { type: Boolean, default: () => false },
    disabled: Boolean,
  },
  setup(props, { attrs }) {
    const input = ref();
    const $el = computed(() => input.value?.$el);
    if (
      props.ipv4 === null &&
      props.ipv6 === null &&
      props.planetary === null &&
      props.wireguard === null &&
      props.mycelium === null
    ) {
      throw new Error("You must provide at least one network  option");
    }
    const error = computed(() => {
      return !(props.ipv4 || props.ipv6 || props.planetary || props.wireguard || props.mycelium) && props.required;
    });

    /* Adapter to work with old code validation */
    const { uid } = getCurrentInstance() as { uid: number };
    const form = useForm();

    const fakeService: InputValidatorService = {
      validate: () => Promise.resolve(true),
      setStatus: noop,
      reset: noop,
      status: ValidatorStatus.Valid,
      error: null,
      $el,
      highlightOnError: true,
    };

    onMounted(() => form?.register(uid.toString(), fakeService));
    onUnmounted(() => form?.unregister(uid.toString()));

    watch(error, invalid => {
      fakeService.status = invalid ? ValidatorStatus.Invalid : ValidatorStatus.Valid;
      form?.updateStatus(uid.toString(), fakeService.status);
    });

    const readonlyWireguard = computed(() => {
      if (!props.requireDomain) return false;
      return !(props.hasCustomDomain && props.ipv4);
    });

    const wireguardTooltip = computed(() =>
      readonlyWireguard.value
        ? "Enabling WireGuard Access allows you to establish private, secure, and encrypted instance connections. Please note that this field will be read-only unless you use a custom domain with IPV4."
        : "Enabling WireGuard Access allows you to establish private, secure, and encrypted instance connections.",
    );

    watch(
      readonlyWireguard,
      readonly => {
        const fn = attrs["onUpdate:wireguard"];
        if (readonly && !props.wireguard && typeof fn === "function") {
          fn(true);
        } else if (typeof fn === "function") fn(false);
      },
      { immediate: true },
    );

    return {
      error,
      input,
      wireguardTooltip,
      readonlyWireguard,
    };
  },
};
</script>
<style>
.v-expansion-panel-title__overlay {
  opacity: 0.05;
}

.v-expansion-panel-title {
  padding: 13px 13px;
}
</style>
