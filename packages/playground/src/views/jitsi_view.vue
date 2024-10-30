<template>
  <view-layout>
    <tf-jitsi />

    <template #list>
      <TfDeploymentList title="Jitsi" :project-name="name" />
    </template>
  </view-layout>
</template>

<script lang="ts">
import { ProjectName } from "../types";
import TfDeploymentList from "../weblets/tf_deployment_list.vue";
import TfJitsi from "../weblets/tf_jitsi.vue";

export default {
  name: "JitsiView",
  components: {
    TfDeploymentList,
    TfJitsi,
  },
  setup() {
    return { name: ProjectName.Jitsi };
  },
};
</script>
