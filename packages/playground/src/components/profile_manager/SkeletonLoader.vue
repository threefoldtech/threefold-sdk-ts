<template>
  <v-row>
    <v-col cols="12" md="9">
      <v-skeleton-loader type="text" height="56" />
    </v-col>
    <v-col cols="12" md="3">
      <v-skeleton-loader type="text" height="56" />
    </v-col>
  </v-row>
  <v-skeleton-loader type="alert" />
  <v-skeleton-loader id="test" type="text" height="56" />
  <v-skeleton-loader type="text" height="56" />
  <v-skeleton-loader type="text" height="56" />
  <div class="text-center">
    <v-skeleton-loader type="actions" height="56" id="actionLoader" />
  </div>
</template>

<style>
#actionLoader .v-skeleton-loader__actions {
  justify-content: center;
}
.v-skeleton-loader__text {
  height: 2rem;
}
</style>
<script lang="ts" setup></script>
