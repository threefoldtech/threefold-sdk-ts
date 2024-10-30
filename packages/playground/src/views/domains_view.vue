<template>
  <view-layout>
    <TfDomains />

    <template #list>
      <TfDeploymentList title="Domains" :project-name="name" :hideSSH="true" />
    </template>
  </view-layout>
</template>

<script lang="ts">
import { ProjectName } from "../types";
import TfDeploymentList from "../weblets/tf_deployment_list.vue";
import TfDomains from "../weblets/tf_domains.vue";

export default {
  name: "DomainsView",
  components: {
    TfDomains,
    TfDeploymentList,
  },
  setup() {
    return { name: ProjectName.Domains };
  },
};
</script>
