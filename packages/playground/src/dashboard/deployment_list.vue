<template>
  <view-layout>
    <template #list>
      <div>
        <div v-for="(project, index) in projects" :key="index">
          <TfDeploymentList :title="`${project.name} Instances`" :project-name="project.value" />
        </div>
      </div>
    </template>
  </view-layout>
</template>

<script lang="ts">
import { ref } from "vue";

import { ProjectName } from "../types";
import TfDeploymentList from "../weblets/tf_deployment_list.vue";
import Subsquid from "../weblets/tf_subsquid.vue";

export default {
  name: "DeploymentsList",
  components: {
    TfDeploymentList,
  },

  setup() {
    const projects = ref();

    // Convert enum to array of objects
    projects.value = Object.keys(ProjectName).map(key => ({
      name: key,
      value: ProjectName[key as keyof typeof ProjectName],
    }));
    Object.keys(ProjectName).forEach(key => {
      const enumValue = ProjectName[key as keyof typeof ProjectName];
      console.log(`${key} = ${enumValue}`);
    });
    return { projects };
  },
};
</script>
