<template>
  <div class="border px-4 pb-4 rounded position-relative">
    <v-card color="primary" class="d-flex justify-center items-center mt-3 pa-3 text-center">
      <v-icon size="30" class="pr-3">mdi-note-check-outline</v-icon>
      <v-card-title class="pa-0">DAO</v-card-title>
    </v-card>

    <div class="d-flex my-6 align-center justify-center" v-if="loadingProposals">
      <v-progress-circular indeterminate />
    </div>

    <div v-else-if="proposals?.active?.length == 0 && proposals?.inactive?.length == 0">
      <v-card class="my-3 pa-3 d-flex justify-center">
        <h3>No proposals at this time</h3>
      </v-card>
    </div>
    <div v-else>
      <v-card>
        <h4 class="d-flex justify-center pa-4">
          You can now vote on proposals!
          <v-icon @click="openInfoModal = true" class="mx-3"> mdi-information-outline </v-icon>
        </h4>
        <v-tabs v-model="activeTab" align-tabs="center">
          <v-tab color="secondary" v-for="(tab, index) in tabs" :key="index" :value="`${index}`">{{ tab.title }}</v-tab>
        </v-tabs>
      </v-card>
      <v-window v-model="activeTab">
        <!--Active-->
        <v-window-item v-for="(tab, index) in tabs" :key="index" :value="`${index}`">
          <v-card>
            <v-text-field
              v-model="searchTerm"
              variant="underlined"
              label="Search by proposal description"
              class="pa-5"
            ></v-text-field>
          </v-card>

          <v-card
            class="my-3 pa-5"
            :class="{
              'dark-bg': route.query.hash == proposal.hash && theme.name.value == 'dark',
              'light-bg': route.query.hash == proposal.hash && theme.name.value == 'light',
            }"
            v-for="(proposal, i) in filteredProposals(tab.content.value)"
            :key="i"
          >
            <div
              class="d-flex align-center"
              :style="{
                justifyContent: proposal.action ? 'space-between' : 'flex-end',
              }"
            >
              <v-card-title class="pa-0 mb-5 font-weight-bold" v-if="proposal.action">
                {{ proposal.action }}
              </v-card-title>
              <div class="d-flex justify-between">
                <v-btn color="secondary" v-bind:href="proposal.link" v-bind:target="'blank'" class="mx-3">
                  Go to Proposal
                </v-btn>
                <v-btn @click="shareProposal(proposal.hash)">Share</v-btn>
              </div>
            </div>
            <v-divider class="mt-1 mb-5 text-red-700" />

            <v-card-text class="pb-0">
              <v-row class="my-1 mb-3">
                <p class="font-weight-bold mr-3">Description:</p>

                <span> {{ proposal.description }}</span>
              </v-row>
              <v-row v-if="expired(proposal.end)" class="my-1">
                <p class="font-weight-bold mr-3">You can vote until:</p>
                <span class="text--secondary">{{ proposal.end }}</span>
              </v-row>
              <v-row v-else class="my-1">
                <p class="font-weight-bold mr-3">Voting ended on:</p>
                <span class="text--secondary">{{ proposal.end }}</span>
              </v-row>
            </v-card-text>
            <v-row class="my-3">
              <v-col class="votes">
                <v-container class="" :style="{}">
                  <v-row v-if="expired(proposal.end)" class="d-flex justify-space-between">
                    <v-btn @click="openVoteDialog(proposal.hash, true)" :disabled="loadingVote" variant="flat"
                      >Yes <v-divider class="mx-3" vertical />{{ proposal.ayes.length }}
                    </v-btn>
                    <div class="d-flex align-center text-center pr-2">
                      <span class="px-1"
                        >Threshold: {{ proposal.nayes.length + proposal.ayes.length }}/{{ proposal.threshold }}
                      </span>
                    </div>
                    <v-btn color="anchor" @click="openVoteDialog(proposal.hash, false)" :disabled="loadingVote"
                      >No <v-divider class="mx-3" vertical />{{ proposal.nayes.length }}
                    </v-btn>
                  </v-row>
                </v-container>
                <v-container :style="{ width: '100%' }" v-if="proposal.ayesProgress > 0 || proposal.nayesProgress > 0">
                  <v-row v-if="expired(proposal.end)" class="">
                    <div :style="{ width: `${proposal.ayesProgress}%` }">
                      <v-progress-linear
                        :height="24"
                        color="primary"
                        v-model="proposal.ayesProgress"
                        :style="{
                          backgroundColor: '#1AA18F',
                          marginRight: 'auto',
                        }"
                      >
                        <span class=""
                          >{{
                            !!(proposal.ayesProgress % 1) ? proposal.ayesProgress.toFixed(2) : proposal.ayesProgress
                          }}%</span
                        >
                      </v-progress-linear>
                    </div>
                    <div :style="{ width: `${proposal.nayesProgress}%` }">
                      <v-progress-linear
                        :height="24"
                        color="#9e9e9e"
                        v-model="proposal.nayesProgress"
                        :style="{
                          backgroundColor: '#9e9e9e',
                          marginRight: 'auto',
                        }"
                      >
                        <v-row class="d-flex justify-center">
                          <span class="text-black"
                            >{{
                              !!(proposal.nayesProgress % 1)
                                ? proposal.nayesProgress.toFixed(2)
                                : proposal.nayesProgress
                            }}%</span
                          >
                        </v-row>
                      </v-progress-linear>
                    </div>
                  </v-row>
                  <v-row v-else justify="center">
                    <v-tooltip style="border: 0px !important" width="220" location="top" :text="'tooltip'">
                      <template #default>
                        <v-card class="pa-2">
                          <h3 class="mb-2 ml-2">
                            Vote details ({{ proposal.ayes.length + proposal.nayes.length }}
                            {{ proposal.ayes.length + proposal.nayes.length > 1 ? "votes" : "vote" }})
                          </h3>
                          <v-divider />
                          <v-row class="mt-1">
                            <v-col class="d-flex align-center ml-2">
                              <p>threshold:</p>
                            </v-col>
                            <v-col class="d-flex align-center justify-end mr-2">
                              <v-chip color="info">
                                {{ proposal.threshold }}
                                {{ proposal.threshold > 1 ? "votes" : "vote" }}
                              </v-chip>
                            </v-col>
                          </v-row>
                          <v-row class="mt-1">
                            <v-col class="d-flex align-center ml-2">
                              <p>Yes:</p>
                            </v-col>
                            <v-col class="d-flex align-center justify-end mr-2">
                              <v-chip color="info">
                                {{ proposal.ayes.length }}
                                {{ proposal.ayes.length > 1 ? "votes" : "vote" }}
                              </v-chip>
                            </v-col>
                          </v-row>
                          <v-row class="mt-1">
                            <v-col class="d-flex align-center ml-2">
                              <p>No:</p>
                            </v-col>
                            <v-col class="d-flex align-center justify-end mr-2">
                              <v-chip color="info">
                                {{ proposal.nayes.length }}
                                {{ proposal.nayes.length > 1 ? "votes" : "vote" }}
                              </v-chip>
                            </v-col>
                          </v-row>
                        </v-card>
                      </template>

                      <template #activator="{ props }">
                        <v-progress-linear
                          v-if="proposal.ayesProgress > proposal.nayesProgress"
                          v-bind="props"
                          rounded
                          v-model="proposal.ayesProgress"
                          color="primary"
                          height="24"
                          :style="{
                            width: '100%',
                            color: '#fff',
                          }"
                        >
                          <template v-slot:default="{ value }">
                            <strong class="mx-3">Accepted </strong>
                            <span>{{ !!(value % 1) ? value.toFixed(2) : value }}%</span>
                          </template>
                        </v-progress-linear>

                        <v-progress-linear
                          v-else
                          v-bind="props"
                          rounded
                          v-model="proposal.nayesProgress"
                          color="disable"
                          height="24"
                          :style="{
                            width: '100%',
                            color: '#333',
                          }"
                        >
                          <template v-slot:default="{ value }">
                            <strong class="mx-3">Rejected </strong>
                            <span>{{ !!(value % 1) ? value.toFixed(2) : value }}%</span>
                          </template>
                        </v-progress-linear>
                      </template>
                    </v-tooltip>
                  </v-row>
                </v-container>
              </v-col>
            </v-row>
          </v-card>
        </v-window-item>
      </v-window>
      <v-dialog v-model="openVDialog" max-width="600" scrollable attach="#modals">
        <v-card>
          <v-card-title>Cast Vote</v-card-title>
          <v-card-text>
            <form-validator v-model="isValidFarm">
              <input-validator :value="selectedFarm" :rules="[validators.required('Required field')]" #="{ props }">
                <input-tooltip tooltip="Select farm you wish to vote with">
                  <v-select
                    :items="userFarms"
                    :item-title="(item: any) => `${item.name}`"
                    :item-value="(item: any) => item.farmID"
                    label="Select a farm"
                    v-model="selectedFarm"
                    v-bind="props"
                  >
                  </v-select>
                </input-tooltip>
              </input-validator>
            </form-validator>
          </v-card-text>
          <v-card-actions class="justify-end mb-1 mr-2">
            <v-btn @click="openVDialog = false" color="anchor">Close</v-btn>
            <v-btn @click="castVote" :loading="loadingVote" color="secondary" :disabled="!isValidFarm">Vote</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="openInfoModal" width="50vw" attach="#modals">
        <v-card>
          <v-card-title class="text-h5 my-2"> Proposals Information </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="textContainer">
              <h2>General</h2>
              <span
                >TFChain council members have exclusive authority to generate proposals, while owners of farms
                containing one or more up nodes can cast votes.</span
              >
              <span> The voting process concludes at the designated maturity date and time of the proposal.</span>
              <span>
                Decisions regarding the proposal's acceptance or rejection are determined by the majority of weighted
                votes.</span
              >
              <span>
                However, a minimum participation threshold must be attained in order for the voting process to be
                considered valid.
              </span>
              <span>
                If the vote count is insufficient and the time limit is reached, the proposal will be rejected.
              </span>
              <a :href="manual.dao" target="_blank">How to vote?</a>
              <br />
              <br />
              <h3>How do we count weight:</h3>
              <span
                >Votes are weighted based on the farmers stake in the network. One vote by default is 1 weight.</span
              >
              <span> If the farmers has nodes, the weight of the vote is calulcated as following:</span>
              <span
                ><b>
                  The farmer's vote weight is the sum of all the farmer's nodes weight. A node's weight is calculated
                  as: node CU * 2 + node SU.</b
                ></span
              >
            </div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="openInfoModal = false" color="anchor"> Close </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { GridClient } from "@threefold/grid_client";
import { type DaoProposalDetails, type DaoProposals, TFChainError } from "@threefold/tfchain_client";
import type moment from "moment";
import { createToast } from "mosha-vue-toastify";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useTheme } from "vuetify";

import { createCustomToast, ToastType } from "@/utils/custom_toast";
import { manual } from "@/utils/manual";

import { useGrid, useProfileManager } from "../stores";
import type { FarmInterface } from "../types";
import { getFarms } from "../utils/get_farms";
import { updateGrid } from "../utils/grid";

const loadingProposals = ref(true);
const activeTab = ref(0);
const activeProposals = ref<DaoProposalDetails[]>();
const inactiveProposals = ref<DaoProposalDetails[]>();
const proposals = ref<DaoProposals>();
const searchTerm = ref("");
const openInfoModal = ref(false);
const openVDialog = ref(false);
const castedVote = ref(false);
const loadingVote = ref(false);
const isValidFarm = ref(false);
const selectedProposal = ref("");
const selectedFarm = ref();
const userFarms = ref<FarmInterface[]>();
const sharedLink = ref("");
const profileManager = useProfileManager();
const profile = ref(profileManager.profile!);
const tabs = [
  { title: "Active", content: activeProposals },
  { title: "Executable", content: inactiveProposals },
];

const gridStore = useGrid();
const grid = gridStore.client as GridClient;

const route = useRoute();
const theme = useTheme();
onMounted(async () => {
  updateGrid(grid, { projectName: "" });

  if (grid) {
    proposals.value = await grid?.dao.get();
    activeProposals.value = proposals.value.active.filter(proposal => proposal.hash);
    inactiveProposals.value = proposals.value.inactive.filter(proposal => proposal.hash);
    userFarms.value = await getFarms(grid, { ownedBy: profile.value.twinId }, {});
    loadingProposals.value = false;
  }
});

function shareProposal(hash: string) {
  sharedLink.value = "";
  sharedLink.value = `${window.location.href}?hash=${hash}`;
  navigator.clipboard.writeText(sharedLink.value);
  createCustomToast("Copied!", ToastType.success);
}

function expired(proposalEnd: moment.Moment) {
  return proposalEnd.isAfter(Date.now());
}
function openVoteDialog(hash: any, vote: boolean) {
  openVDialog.value = true;
  castedVote.value = vote;
  selectedProposal.value = hash;
}
function filteredProposals(proposals: DaoProposalDetails[] | undefined) {
  if (searchTerm.value.length) {
    if (proposals) {
      return proposals.filter(proposal => proposal.description.toLowerCase().includes(searchTerm.value.toLowerCase()));
    }
  }
  return proposals;
}
async function castVote() {
  loadingVote.value = true;
  if (grid) {
    try {
      await grid.dao.vote({
        farmId: selectedFarm.value,
        approve: castedVote.value,
        hash: selectedProposal.value,
      });
      const { ayes, nays, ayesProgress, nayesProgress } = await grid.dao.getProposalVotes(selectedProposal.value);
      const updatedProposal = proposals.value?.active.find(proposal => proposal.hash === selectedProposal.value);
      if (updatedProposal) {
        updatedProposal.ayes = ayes;
        updatedProposal.nayes = nays;
        updatedProposal.ayesProgress = ayesProgress;
        updatedProposal.nayesProgress = nayesProgress;
      }
      createToast("Voted for proposal!", {
        position: "top-right",
        hideProgressBar: true,
        toastBackgroundColor: "#1aa18f",
        timeout: 5000,
        showIcon: true,
        type: "success",
      });
      openVDialog.value = false;
    } catch (err) {
      let errMsg = `Vote Failed!`;

      if (err instanceof TFChainError && err.keyError == "DuplicateVote") {
        errMsg = "Failed to vote. You have already voted.";
      }
      console.error(errMsg, err);

      createToast(errMsg, {
        position: "top-right",
        hideProgressBar: true,
        toastBackgroundColor: "#FF5252",
        timeout: 5000,
        showIcon: true,
        type: "danger",
      });
    }
  }
  loadingVote.value = false;
}
</script>
<style>
@import "highlight.js/styles/atom-one-dark.css";
@import "highlight.js/styles/atom-one-light.css";

.light-bg {
  color: #333333 !important;
  background-color: #f6f6f6 !important;
}
.dark-bg {
  background-color: var(--v-theme-background-overlay-multiplier);
}

.custom-container {
  width: 80%;
}
.votes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.v-tooltip > .v-overlay__content {
  padding: 0px 0px !important;
  border: 1px solid #5a5959 !important;
}
.highlight-card {
  background-color: var(--v-theme-background-overlay-multiplier);
}
</style>
