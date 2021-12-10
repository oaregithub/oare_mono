<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <slot name="header"></slot>

    <v-card-title
      class="oare-header d-flex justify-space-between align-center test-content-title"
    >
      <slot name="title">
        <div class="d-flex align-center">
          <slot name="title:pre"></slot>
          <span
            class="font-weight-bold"
            v-if="title !== null && title !== undefined"
            >{{ title }}
            <v-menu offset-y open-on-hover v-if="informationCard !== null">
              <template #activator="{ on, attrs }">
                <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
                  mdi-information-outline
                </v-icon>
              </template>
              <v-card class="pa-3">
                {{ informationCard }}
              </v-card>
            </v-menu>
          </span>
          <slot name="title:post"></slot>
        </div>
      </slot>
    </v-card-title>
    <v-card-text class="black--text">
      <slot></slot>
    </v-card-text>
    <v-card-actions>
      <slot name="actions"></slot>
    </v-card-actions>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OareContentView',
  props: {
    title: {
      type: String,
      default: null,
    },
    informationCard: {
      type: String,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
