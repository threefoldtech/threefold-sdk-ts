<template>
  <div ref="inputElement" class="input-validator w-100">
    <slot
      :props="{
        onBlur,
        loading,
        errorMessages,
        error: showError,
        hint: inputHint,
        'persistent-hint': hintPersistent,
        class: extraClass,
      }"
    ></slot>
  </div>
</template>

<script lang="ts">
import debounce from "lodash/debounce.js";
import { computed, getCurrentInstance, onMounted, onUnmounted, type PropType, ref, watch } from "vue";

import { useForm, ValidatorStatus } from "@/hooks/form_validator";
import type { InputValidatorService } from "@/hooks/input_validator";

import type { INode } from "../utils/filter_nodes";

export default {
  name: "InputValidator",
  props: {
    modelValue: Boolean,
    status: String as PropType<ValidatorStatus>,
    rules: {
      type: Array as PropType<SyncRule[]>,
      required: true,
    },
    asyncRules: {
      type: Array as PropType<AsyncRule[]>,
      required: false,
      default: () => [] as AsyncRule[],
    },
    value: {
      type: String as PropType<string | number | INode | undefined>,
      required: true,
    },
    defaultValue: { type: Object as PropType<any>, default: () => undefined },
    validMessage: String,
    hint: String,
    disableValidation: Boolean,
    debounceTime: Number,
    inputName: String,
  },
  emits: {
    "update:modelValue": (valid: boolean) => valid,
    "update:status": (status: ValidatorStatus) => status,
    "update:error": (error: string | null) => true || error,
    "update:value": (value: any) => true || value,
  },
  setup(props, { emit, expose }) {
    const { uid: _uid } = getCurrentInstance() as { uid: number };
    const uid = props.inputName || _uid.toString();
    const form = useForm();
    const inputElement = ref<HTMLElement | null>(null);

    const required = computed(() => props.rules.some(rule => "required" in (rule("") || {})));

    const status = ref<ValidatorStatus>(ValidatorStatus.Init);
    function setStatus(newStatus: ValidatorStatus): void {
      if (status.value !== newStatus) {
        status.value = newStatus;
        emit("update:modelValue", newStatus === ValidatorStatus.Valid);
        emit("update:status", newStatus);
        form?.updateStatus(uid, newStatus);
      }
    }

    const error = ref<string | null>(null);
    watch(error, error => emit("update:error", error), { immediate: true });

    const _validate = async function (value = props.value): Promise<boolean> {
      blured.value = true;
      setStatus(ValidatorStatus.Pending);

      value = (value || "").toString();
      error.value = null;

      if (!value && !required.value) {
        setStatus(ValidatorStatus.Valid);
        return true;
      }

      for (const rules of [...props.rules, ...props.asyncRules]) {
        const errorObj = await rules(value);
        if (errorObj) {
          error.value = errorObj.message;
          break;
        }
      }

      setStatus(error.value ? ValidatorStatus.Invalid : ValidatorStatus.Valid);
      return !error.value;
    };
    const validate = props.debounceTime ? debounce(_validate, props.debounceTime) : _validate;
    const debouncedValidate = props.debounceTime ? validate : debounce(validate, 250);

    const initializedInput = ref(false);
    watch(
      () => props.value,
      value => {
        /* Ignore initial passed value */

        if (!initializedInput.value) {
          initializedInput.value = true;
          if (!value) {
            return;
          }
        }

        debouncedValidate(value);
      },
      { immediate: true },
    );

    watch(
      () => props.disableValidation,
      (disabled, wasDisabled) => {
        const isEnabled = !disabled;
        const wasEnabled = !wasDisabled;

        if (disabled && wasEnabled) {
          form?.unregister(uid);
          error.value = null;
          setStatus(ValidatorStatus.Valid);
        }

        if (wasDisabled && isEnabled) validate();
      },
    );

    const blured = ref(false);
    function onBlur() {
      blured.value = true;
      validate();
    }

    // Set Form connection
    const obj: InputValidatorService = {
      $el: inputElement,
      validate: validate as InputValidatorService["validate"],
      setStatus,
      reset() {
        emit("update:value", props.defaultValue);
        initializedInput.value = false;
        blured.value = false;
        setStatus(ValidatorStatus.Init);
        error.value = null;
      },
      status: status as unknown as ValidatorStatus,
      error: error as unknown as string | null,
    };
    onMounted(() => form?.register(uid, obj));
    onUnmounted(() => form?.unregister(uid));
    expose(obj);

    return {
      inputElement,
      onBlur: computed(() => (blured.value ? undefined : onBlur)),
      loading: computed(() => status.value === ValidatorStatus.Pending),
      errorMessages: computed(() => (error.value ? [error.value] : [])),
      showError: computed(() => Boolean(error.value)),
      inputHint: computed(() => {
        if (status.value === ValidatorStatus.Pending) return "Validating...";
        if (status.value === ValidatorStatus.Valid) return props.validMessage || "";
        return props.hint || "";
      }),
      hintPersistent: computed(() => status.value !== ValidatorStatus.Invalid),
      extraClass: status.value === ValidatorStatus.Valid ? "is-valid-input" : undefined,
    };
  },
};

export type RuleReturn = { message: string; [key: string]: any } | undefined | void;
export type SyncRule = (value: string) => RuleReturn;
export type AsyncRule = (value: string) => Promise<RuleReturn>;
</script>

<style lang="scss">
.is-valid-input {
  .v-messages__message {
    color: rgba(var(--v-theme-success));
  }
}
</style>
