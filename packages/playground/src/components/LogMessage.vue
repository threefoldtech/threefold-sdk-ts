<template>
  <VListItem class="log-list-item py-0">
    <template #prepend>
      <span
        class="text-uppercase mr-3 py-3 text-center border h-100 text-subtitle-2"
        :class="{
          'text-primary': log.data.type === 'log',
          'text-error': log.data.type === 'error',
          'text-warning': log.data.type === 'warn',
          'text-blue': log.data.type === 'debug',
        }"
        :style="{
          width: '80px',
          borderTopWidth: '0 !important',
          borderBottomWidth: '0 !important',
          borderLeftWidth: '0 !important',
        }"
      >
        [{{ log.data.type }}]
      </span>
    </template>
    <VListItemSubtitle class="pt-3 mb-2 text-caption d-flex align-center">
      <span v-text="log.data.timestamp" />
      <VSpacer />
      <div v-show="collapsable">
        <VBtn @click="collapsed = !collapsed" size="xs" class="pa-1 text-body-1 text-info">
          <div class="d-flex align-center">
            <VIcon :icon="collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'" class="mr-1 text-body-1" />
            <span v-text="collapsed ? 'show more' : 'show less'" />
          </div>
        </VBtn>
        &nbsp;|&nbsp;
      </div>
      <VBtn @click="copyLog(log.data.message)" size="xs" class="pa-1 text-link text-body-1">
        <div class="d-flex align-center">
          <VIcon icon="mdi-content-copy" size="xs" class="mr-1 text-caption" />
          <span v-text="'Copy'" />
        </div>
      </VBtn>
    </VListItemSubtitle>
    <VListItemTitle class="text-pre-wrap text-body-2 pb-3">
      {{ log.data.message.slice(0, collapsable && collapsed ? 200 : 5_000) }}
      {{ collapsable && collapsed ? "..." : "" }}
      <span
        v-if="collapsable && !collapsed && log.data.message?.length > 5_000"
        class="text-error"
        v-text="'(Your log message very long copy it for more details.)'"
      />
      &nbsp;
      <a
        v-if="collapsable"
        @click="collapsed = !collapsed"
        class="show-more-btn"
        v-text="collapsed ? 'show more' : 'show less'"
      />
    </VListItemTitle>
  </VListItem>
</template>

<script lang="ts">
import { type PropType } from "vue";
import { computed, toRef } from "vue";

import type { Indexed } from "@/clients";
import { createCustomToast, ToastType } from "@/utils/custom_toast";

import type { LoggerInstance } from "./logger.vue";

function copyLog(msg: string): void {
  window.navigator.clipboard.writeText(msg);
  createCustomToast("Copied!", ToastType.success);
}

export default {
  name: "LogMessage",
  props: {
    log: { type: Object as PropType<Indexed<LoggerInstance>>, required: true },
  },
  setup(_props) {
    const props = toRef(_props);

    const collapsable = computed(() => props.value.log.data.message?.length > 200);
    const collapsed = computed(() => !!props.value.log?.id);

    return { collapsable, collapsed, copyLog };
  },
};
</script>

<style>
.show-more-btn {
  cursor: pointer;
}

.show-more-btn:hover {
  text-decoration: underline;
}
</style>
