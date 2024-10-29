<template>
  <div
    class="d-flex flex-column"
    :style="{
      height: !collapsible ? 'calc(750px + 48px)' : 'auto',
      background: 'rgb(var(--v-theme-surface))',
      color: 'rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity))',
    }"
  >
    <div>
      <VCardTitle
        class="d-flex align-center"
        :style="[collapsible ? { cursor: 'pointer' } : {}]"
        @click="collapsible ? (filterOpened = !filterOpened) : undefined"
      >
        <span>Filters</span>
        <VSpacer />
        <VBtn variant="outlined" :disabled="loading || empty" @click.stop="clear" text="Clear" density="compact" />
        <VBtn
          variant="outlined"
          color="secondary"
          density="compact"
          :disabled="!valid || !changed"
          @click.stop="apply"
          text="Apply"
          :loading="loading"
          class="mx-2"
        />
        <VBtn
          :icon="filterOpened ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          density="compact"
          variant="flat"
          v-if="collapsible"
        />
      </VCardTitle>
    </div>

    <VDivider />

    <div>
      <VRow no-gutters v-show="valid && (changed || (!loading && !empty))">
        <VAlert color="info" variant="tonal" class="rounded-0">
          <span>
            {{ changed ? "Filter options were updated but not applied." : "" }} Click
            <VCard
              class="d-inline pa-1"
              v-text="changed ? 'Apply' : 'Clear'"
              flat
              :color="$vuetify.theme.global.name === 'light' ? 'info' : undefined"
            />
            {{ changed ? "in order to reload your data." : "to reset your selected filters." }}
          </span>
        </VAlert>
      </VRow>
    </div>

    <div
      class="flex-grow-1"
      :style="{
        overflowY: 'auto',
      }"
    >
      <div>
        <VExpandTransition mode="in-out">
          <VForm :disabled="loading" v-show="!collapsible || filterOpened">
            <FormValidator valid-on-init v-model="valid">
              <VContainer fluid>
                <VRow no-gutters>
                  <slot />
                </VRow>
              </VContainer>
            </FormValidator>
          </VForm>
        </VExpandTransition>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { onUnmounted } from "vue";
import { computed, type ComputedRef, inject, onMounted, provide, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const key = Symbol("key:filters-container");

export interface FilterService {
  empty: boolean;
  changed: boolean;
  clear(): boolean;
  apply(): [name: string, value?: string];
}

export interface FiltersContainerService {
  register(name: string, service: ComputedRef<FilterService>): void;
  unregister(name: string, changed?: boolean): void;
}

export function useFiltersContainerService() {
  return inject(key) as FiltersContainerService;
}

export default {
  name: "TfFiltersContainer",
  props: { loading: Boolean },
  emits: {
    apply: () => true,
  },
  setup(_, ctx) {
    const router = useRouter();
    const route = useRoute();
    const filters = ref(new Map<string, ComputedRef<FilterService>>());

    const valid = ref(false);
    const queryNames = computed(() => [...filters.value.keys()]);
    const services = computed(() => [...filters.value.values()]);

    const empty = computed(() => services.value.every(s => s.value.empty));
    const changed = computed(() => services.value.some(s => s.value.changed));

    const service: FiltersContainerService = {
      register(name, service) {
        filters.value.set(name, service);
      },

      unregister(name, changed) {
        if (changed) {
          const query = { ...router.currentRoute.value.query };
          if (name in query) {
            delete query[name];
            router.replace({ query });
            ctx.emit("apply");
          }
        }
        filters.value.delete(name);
      },
    };

    provide(key, service);

    function clear() {
      const clears = services.value.map(service => service.value.clear());

      const query = { ...router.currentRoute.value.query };
      for (const name of queryNames.value) {
        delete query[name];
      }

      router.replace({ query });
      clears.some(c => c) && ctx.emit("apply");
    }

    onMounted(apply);
    function apply() {
      const applys = services.value.map(service => service.value.apply());

      router.replace({
        query: applys.reduce((query, [name, value]) => {
          query[name] = value;
          return query;
        }, {} as { [name: string]: string | undefined }),
      });

      ctx.emit("apply");
    }

    const collapsible = ref(false);
    const filterOpened = ref(true);

    const breakpoint = route.meta.filtersCollapsibleBreakpoint as number;

    function onResize() {
      collapsible.value = breakpoint > window.innerWidth;
    }

    function onEnterApply(e: KeyboardEvent) {
      if (e.keyCode == 13 && valid.value && changed.value) apply();
    }

    onMounted(() => typeof breakpoint === "number" && window.addEventListener("resize", onResize));
    onMounted(() => window.addEventListener("keyup", onEnterApply));
    onUnmounted(() => typeof breakpoint === "number" && window.removeEventListener("resize", onResize));
    onUnmounted(() => window.removeEventListener("keyup", onEnterApply));

    typeof breakpoint === "number" && onResize();

    return { empty, changed, clear, apply, valid, collapsible, filterOpened };
  },
};
</script>
