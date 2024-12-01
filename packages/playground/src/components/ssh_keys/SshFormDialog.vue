<template>
  <v-dialog
    @click:outside="() => $emit('close')"
    @keydown.esc="() => $emit('close')"
    v-model="$props.open"
    max-width="800"
    attach="#modals"
  >
    <template v-slot:default>
      <v-form v-model="isValidForm">
        <v-card>
          <v-toolbar color="primary" class="custom-toolbar">
            <p class="mb-5">
              {{ $props.dialogType === SSHCreationMethod.Generate ? "Generate a new SSH Key" : "Import an SSH Key" }}
            </p>
          </v-toolbar>

          <v-card-text>
            <input-tooltip
              width="500"
              location="top right"
              tooltip="Enter a descriptive name for your SSH key to easily identify it later, e.g., 'My-Laptop-Key' or 'Work-Server-Key'."
            >
              <v-text-field
                hint="Leave this field empty to generate a name automatically, or enter a custom name to save it with your key."
                class="mb-4"
                hide-details="auto"
                v-model="keyName"
                label="Name"
                :rules="sshNameRules(keyName)"
              />
            </input-tooltip>

            <v-alert width="95%" class="mb-4" type="info">
              {{ $props.dialogType === SSHCreationMethod.Generate ? "Generating" : "Importing" }}
              a new SSH key will cost you up to
              {{ sshKeysManagement.updateCost }} TFT
            </v-alert>

            <div v-if="$props.dialogType === SSHCreationMethod.Generate" class="create">
              <v-alert width="95%" type="info" class="my-4">
                We will not keep your private key information. Be sure to save the private key downloaded after
                creation.
              </v-alert>
            </div>

            <div class="import" v-if="$props.dialogType === SSHCreationMethod.Import">
              <input-tooltip
                class="mt-4"
                width="500"
                location="top right"
                #="{ props }"
                tooltip="This key will be used for authentication when accessing remote servers securely via SSH protocol."
              >
                <CopyInputWrapper :data="sshKey" #="{ props: copyInputProps }">
                  <v-textarea
                    hide-details="auto"
                    v-model.trim="sshKey"
                    no-resize
                    label="Public SSH Key"
                    v-bind="{ ...props, ...copyInputProps }"
                    :rules="sshRules(sshKey)"
                  >
                  </v-textarea>
                </CopyInputWrapper>
              </input-tooltip>
            </div>
            <v-divider />
          </v-card-text>

          <v-card-actions class="justify-end mb-1 mr-2">
            <v-btn color="anchor" text="Close" @click="$emit('close')"></v-btn>

            <v-btn
              v-if="$props.dialogType === SSHCreationMethod.Generate"
              @click="generateSSHKey"
              :loading="generating"
              :disabled="!isValidForm || generating || !!generatedSshKey"
              color="secondary"
            >
              Generate and Save
            </v-btn>
            <v-btn
              v-if="$props.dialogType === SSHCreationMethod.Import"
              :loading="$props.savingKey"
              :disabled="!isValidForm"
              color="secondary"
              text="Save"
              @click="createNewSSHKey"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </template>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { GridClient } from "@threefold/grid_client";
import { defineComponent, onMounted, type PropType, ref, watch } from "vue";

import { useGrid } from "@/stores";
import { type Profile, useProfileManager } from "@/stores/profile_manager";
import { SSHCreationMethod, type SSHKeyData } from "@/types";
import { type Balance, loadBalance } from "@/utils/grid";
import SSHKeysManagement from "@/utils/ssh";

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  generating: {
    type: Boolean,
    required: false,
  },
  generatedSshKey: {
    type: String,
    required: false,
  },
  savingKey: {
    type: Boolean,
    required: false,
  },
  allKeys: {
    type: Object as PropType<SSHKeyData[]>,
    required: true,
  },
  dialogType: {
    type: Object as PropType<SSHCreationMethod>,
    required: true,
  },
});

const emits = defineEmits(["close", "save", "generate"]);

const profileManager = useProfileManager();
const gridStore = useGrid();
const grid = gridStore.client as unknown as GridClient;
const sshKeysManagement = new SSHKeysManagement();
const isValidForm = ref<boolean>(false);

const sshKey = ref<string>("");
const keyName = ref<string>("");
const createdKey = ref<SSHKeyData | null>(null); // Initialize createdKey with null
const balance = ref<Balance>();
const loadingBalance = ref<boolean>(false);
let interval: any;

onMounted(generateUniqueSSHKeyName);

function generateSSHKey() {
  const now = new Date();
  const keyId = props.allKeys.length ? props.allKeys[props.allKeys.length - 1].id + 1 : 1;

  createdKey.value = {
    id: keyId,
    publicKey: "",
    createdAt: sshKeysManagement.formatDate(now),
    name: keyName.value,
    isActive: true,
  };

  emits("generate", createdKey.value);
}

function createNewSSHKey() {
  const now = new Date();
  const keyId = props.allKeys.length ? props.allKeys[props.allKeys.length - 1].id + 1 : 1;

  createdKey.value = {
    id: keyId,
    publicKey: sshKey.value,
    createdAt: sshKeysManagement.formatDate(now),
    name: keyName.value,
    isActive: true,
  };

  createdKey.value.publicKey = sshKey.value;
  const parts = createdKey.value.publicKey.split(" ");

  if (parts.length === 3 && keyName.value === "") {
    const importedKeyName = parts[parts.length - 1];
    if (importedKeyName.length < 30 && sshKeysManagement.availableName(importedKeyName)) {
      keyName.value = parts[parts.length - 1];
    }
  }

  createdKey.value.name = keyName.value;

  emits("save", createdKey.value);
}

function generateUniqueSSHKeyName() {
  const keys = sshKeysManagement.list();
  let keyNameValue = sshKeysManagement.generateName()!;

  if (!keyNameValue) {
    const lastKeyName = keys[keys.length - 1].name;
    const lastChar = lastKeyName.charAt(lastKeyName.length - 1);
    const isNumber = !isNaN(parseInt(lastChar));

    if (isNumber) {
      const baseName = lastKeyName.slice(0, -1);
      const number = parseInt(lastChar) + 1;
      keyNameValue = `${baseName}${number}`;
    } else {
      keyNameValue = `${lastKeyName}-1`;
    }
  }

  keyName.value = keyNameValue;
}

async function __loadBalance(profile?: Profile, tries = 1) {
  profile = profile || profileManager.profile!;
  if (!profile) return;

  try {
    loadingBalance.value = true;
    balance.value = await loadBalance(grid!);
    loadingBalance.value = false;
  } catch {
    if (tries > 10) {
      loadingBalance.value = false;
      return;
    }

    setTimeout(() => __loadBalance(profile, tries + 1), Math.floor(Math.exp(tries) * 1_000));
  }
}

watch(
  () => profileManager.profile,
  profile => {
    if (profile) {
      __loadBalance(profile);
      if (interval) clearInterval(interval);
      interval = setInterval(__loadBalance.bind(undefined, profile), 1000 * 60 * 2);
    } else {
      if (interval) clearInterval(interval);
      balance.value = undefined;
    }
  },
  { immediate: true, deep: true },
);

function sshRules(value: any) {
  return [
    (v: string) => !!v || "SSH key is required.",
    (v: string) => sshKeysManagement.availablePublicKey(v) || "You have another key with the same public key.",
    (v: string) =>
      sshKeysManagement.isValidSSHKey(v) ||
      "The SSH key you provided is not valid. Please double-check that it is copied correctly and follows the correct format.",
  ];
}

function sshNameRules(value: any) {
  return [
    (v: string) => v.length < 30 || "Please enter a key name with fewer than 30 characters.",
    (v: string) => !v.includes(" ") || "Key names cannot include spaces. Please use a name without spaces.",
    (v: string) => sshKeysManagement.availableName(v) || "You have another key with the same name.",
  ];
}
</script>

<script lang="ts">
export default defineComponent({
  name: "SSHForm",
});
</script>

<style scoped>
.custom-toolbar {
  height: 2.5rem !important;
  padding-left: 10px;
}
.custom-actions {
  border-top: 1px solid rgb(101 99 99);
  display: flex;
  justify-content: center;
  margin: 13px;
}
</style>
