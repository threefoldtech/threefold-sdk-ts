<template>
  <v-card id="skeleton-card" class="h-100 py-3">
    <v-skeleton-loader id="skeleton-card__alert" type="text" />
    <v-row>
      <v-col id="skeleton-card__col-main" cols="12" md="9">
        <v-skeleton-loader id="skeleton-card__col-main-text" type="text" height="56" />
      </v-col>
      <v-col id="skeleton-card__col-secondary" cols="12" md="3">
        <v-skeleton-loader id="skeleton-card__col-secondary-text" type="text" height="56" />
      </v-col>
    </v-row>
    <v-skeleton-loader id="skeleton-card__alert-secondary" type="alert" />
    <v-skeleton-loader id="skeleton-card__text-test" type="text" height="56" />
    <v-skeleton-loader id="skeleton-card__text-1" type="text" height="56" />
    <v-skeleton-loader id="skeleton-card__text-2" type="text" height="56" />
    <div id="skeleton-card__actions">
      <v-skeleton-loader
        id="skeleton-card__actions-loader"
        class="skeleton-card__actions-loader"
        type="actions"
        height="56"
      />
    </div>
  </v-card>
</template>

<style>
#skeleton-card__actions .v-skeleton-loader__actions {
  justify-content: center;
}
.v-skeleton-loader__text {
  height: 2rem;
}
#skeleton-card__actions .v-skeleton-loader__actions .v-skeleton-loader__button {
  max-width: 6rem;
}

#skeleton-card__alert .v-skeleton-loader__text {
  height: 3rem;
}
</style>
