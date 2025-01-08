<template>
  <section>
    <h6 class="text-h5 mb-4 mt-2" v-if="!hideTitle">Domain Name</h6>

    <input-tooltip tooltip="Use a custom domain">
      <div>
        <VSwitch color="primary" inset label="Custom Domain" v-model="enableCustomDomain" hide-details />
      </div>
    </input-tooltip>

    <div ref="input">
      <VForm v-model="domainNameValid">
        <VExpandTransition>
          <input-tooltip tooltip="Domain Name that will point to this instance" v-if="enableCustomDomain">
            <VTextField
              ref="customDomainInput"
              label="Custom Domain"
              placeholder="Your custom domain"
              v-model="customDomain"
              @vue:mounted="customDomain && ($refs.customDomainInput as VInput).validate()"
              validate-on="input"
              :rules="[
                d => (d ? true : 'Domain name is required.'),
                d => validators.isFQDN('Please provide a valid domain name.')(d)?.message || true,
              ]"
              @blur="($refs.customDomainInput as VInput).validate()"
            />
          </input-tooltip>
        </VExpandTransition>

        <VExpandTransition>
          <input-tooltip
            tooltip="Creates a subdomain for your instance on the selected domain to be able to access your instance from the browser."
            v-if="!disableSelectedDomain"
          >
            <VAutocomplete
              ref="domainInput"
              validate-on="input"
              label="Select domain"
              placeholder="Select a domain"
              :items="loadedDomains"
              :loading="domainsTask.loading"
              item-title="publicConfig.domain"
              v-model="selectedDomain"
              :error-messages="domainsTask.error?.message"
              @vue:mounted="selectedDomain && ($refs.domainInput as VInput).validate()"
              :rules="[d => (d ? true : 'Domain is required.')]"
              @update:menu="opened => !opened && $nextTick().then(() => ($refs.domainInput as VInput).validate())"
              @blur="$nextTick().then(() => ($refs.domainInput as VInput).validate())"
              return-object
            >
              <template #append-item v-if="pagination.page !== -1">
                <VContainer>
                  <VBtn
                    @click="loadDomains"
                    block
                    color="secondary"
                    variant="tonal"
                    :loading="domainsTask.loading"
                    prepend-icon="mdi-reload"
                  >
                    Load More Domains
                  </VBtn>
                </VContainer>
              </template>
              <template v-slot:append>
                <v-slide-x-reverse-transition mode="out-in">
                  <v-icon icon="mdi-reload" @click="reloadDomains"></v-icon>
                </v-slide-x-reverse-transition>
              </template>
            </VAutocomplete>
          </input-tooltip>
        </VExpandTransition>

        <v-alert
          v-if="
            !disableSelectedDomain &&
            useFQDN &&
            modelValue &&
            modelValue.customDomain &&
            selectedDomain?.publicConfig?.ipv4
          "
          class="mb-4"
          type="warning"
          variant="tonal"
        >
          Before starting the deployment, Please make sure to create an A record on your name provider with
          <span class="font-weight-bold">{{ customDomain }}</span> pointing to
          <span class="font-weight-bold">{{ selectedDomain.publicConfig.ipv4.split("/")[0] }}</span>
        </v-alert>
      </VForm>
    </div>
  </section>
</template>

<script lang="ts">
import type { FarmInfo, FilterOptions, NodeInfo } from "@threefold/grid_client";
import { noop } from "lodash";
import { computed, getCurrentInstance, nextTick, onUnmounted, type PropType, ref, watch } from "vue";
import { onMounted } from "vue";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { VInput } from "vuetify/components/VInput";

import type { InputValidatorService } from "@/hooks/input_validator";

import { useAsync, usePagination, useWatchDeep } from "../../hooks";
import { useForm, ValidatorStatus } from "../../hooks/form_validator";
import { useGrid } from "../../stores";
import type { DomainInfo, SelectionDetailsFilters } from "../../types/nodeSelector";
import { getNodePageCount, loadNodes } from "../../utils/nodeSelector";

export default {
  name: "TfDomainName",
  props: {
    modelValue: Object as PropType<DomainInfo>,
    filters: {
      type: Object as PropType<SelectionDetailsFilters>,
      required: true,
    },
    farm: Object as PropType<FarmInfo>,
    hideTitle: Boolean,
    status: String as PropType<ValidatorStatus>,
    useFqdn: Boolean,
  },
  emits: {
    "update:model-value": (domain?: DomainInfo) => true || domain,
    "update:status": (status: ValidatorStatus) => true || status,
  },
  setup(props, ctx) {
    const gridStore = useGrid();
    const input = ref<HTMLElement>();

    const loadedDomains = ref<NodeInfo[]>([]);
    const domainsTask = useAsync(loadNodes, {
      onAfterTask({ data }) {
        loadedDomains.value = loadedDomains.value.concat(data as NodeInfo[]);
        pagination.value.next();
      },
      default: [],
    });
    const pageCountTask = useAsync(getNodePageCount, { default: 1 });
    const pagination = usePagination();

    const enableCustomDomain = ref(false);
    const filters = computed<FilterOptions>(() => ({
      gateway: true,
      size: window.env.PAGE_SIZE,
      page: Math.max(1, pagination.value.page),
      farmId: enableCustomDomain.value ? props.farm?.farmId : undefined,
      availableFor: gridStore.client?.twinId,
    }));
    const selectedDomain = ref<NodeInfo | null>(null);
    const loadDomains = () => domainsTask.value.run(gridStore, filters.value);

    const reloadDomains = async (_filters: FilterOptions = filters.value) => {
      if (selectedDomain.value) {
        selectedDomain.value = null;
        bindModelValue();
        bindStatus();
      }
      await pageCountTask.value.run(gridStore, _filters);
      pagination.value.reset(pageCountTask.value.data as number);
      await nextTick();
      loadedDomains.value = [];
      return loadDomains();
    };
    useWatchDeep(filters, reloadDomains, {
      immediate: true,
      deep: true,
      ignoreFields: ["page"],
    });
    // let previousFilters = JSON.stringify(filters.value);
    // useWatchDeep(
    //   filters,
    //   newFilters => {
    //     const currentFilters = JSON.stringify(newFilters);
    //     if (currentFilters !== previousFilters) {
    //       reloadDomains();
    //       previousFilters = currentFilters;
    //     }
    //   },
    //   { immediate: true, deep: true, ignoreFields: ["page"] },
    // );
    const customDomain = ref("");

    const domainNameValid = ref<boolean | null>(null);
    watch(domainNameValid, valid => {
      bindStatus(valid === null ? ValidatorStatus.Init : valid ? ValidatorStatus.Valid : ValidatorStatus.Invalid);
    });

    const disableSelectedDomain = computed(() => enableCustomDomain.value && props.filters.ipv4 === true);
    const useFQDN = computed(() => enableCustomDomain.value && (props.useFqdn || props.filters.ipv4 === false));

    const domain = computed<DomainInfo>(() => {
      return {
        selectedDomain: disableSelectedDomain.value ? null : selectedDomain.value,
        enableSelectedDomain: !disableSelectedDomain.value,
        enabledCustomDomain: enableCustomDomain.value,
        customDomain: enableCustomDomain.value ? customDomain.value : "",
        useFQDN: useFQDN.value,
      };
    });

    useWatchDeep(domain, bindModelValue, { immediate: true, deep: true });

    onUnmounted(() => {
      bindModelValue();
      bindStatus();
    });

    function bindModelValue(domain?: DomainInfo): void {
      ctx.emit("update:model-value", domain);
    }

    /* Adapter to work with old code validation */
    const { uid } = getCurrentInstance() as { uid: number };
    const form = useForm();

    const fakeService: InputValidatorService = {
      validate: () => Promise.resolve(true),
      setStatus: noop,
      reset: noop,
      status: ValidatorStatus.Init,
      error: null,
      $el: input,
    };

    onMounted(() => form?.register(uid.toString(), fakeService));
    onUnmounted(() => form?.unregister(uid.toString()));

    onMounted(bindStatus);
    function bindStatus(status?: ValidatorStatus): void {
      const s = status || ValidatorStatus.Init;
      fakeService.status = s;
      form?.updateStatus(uid.toString(), s);
      ctx.emit("update:status", s);
    }

    return {
      pagination,
      input,

      domainNameValid,

      enableCustomDomain,
      customDomain,

      domainsTask,
      loadedDomains,
      selectedDomain,
      loadDomains,
      reloadDomains,

      disableSelectedDomain,
      useFQDN,
    };
  },
};
</script>
