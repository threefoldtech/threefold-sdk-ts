<template>
  <div class="d-flex" v-if="!disabled" v-bind="$attrs">
    <v-tooltip :text="tooltip || 'None!'" :location="location" :width="width ? width : ''">
      <template #activator="{ props }">
        {{ getPropsRef(props) }}
        <div class="d-flex" :class="{ 'w-100': !inline, 'align-center': alignCenter, 'justify-center': justifyCenter }">
          <slot></slot>
          <span
            :style="{
              cursor: 'help',
              marginTop: $props.alignCenter ? '' : '17.5px',
            }"
            class="ml-3"
            @mouseenter="propsRef?.onMouseenter"
            @mouseleave="propsRef?.onMouseleave"
            @focus="propsRef?.onFocus"
            @blur="propsRef?.onBlur"
          >
            <a :href="href" target="_blank">
              <v-icon>mdi-information-outline</v-icon>
            </a>
          </span>
        </div>
      </template>
    </v-tooltip>
  </div>
  <slot v-else />
</template>

<script lang="ts">
import { type PropType, ref } from "vue";
import type { VTooltip } from "vuetify/components/VTooltip";

export default {
  name: "InputTooltip",
  props: {
    tooltip: {
      type: String,
      required: true,
    },
    inline: {
      type: Boolean,
      default: () => false,
    },
    href: {
      type: String,
      required: false,
    },
    alignCenter: {
      type: Boolean,
      required: false,
    },
    location: {
      type: String as PropType<VTooltip["location"]>,
      required: false,
    },
    width: {
      type: String,
      required: false,
    },
    disabled: Boolean,
    justifyCenter: {
      type: Boolean,
      required: false,
    },
  },
  setup() {
    const appendIcon = "mdi-information";

    const propsRef = ref<any>();
    function getPropsRef(_props: any) {
      propsRef.value = _props;
      return null;
    }

    return {
      appendIcon,
      getPropsRef,
      propsRef,
    };
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: inherit !important;
}
</style>
