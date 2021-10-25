<template>
  <v-list-item-group dark active-class="white--text">
    <router-link v-for="(route, idx) in routes" :key="idx" :to="route.path">
      <v-list-item :data-testid="route.label">
        <v-list-item-content>
          <v-list-item-title>{{ route.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </router-link>
  </v-list-item-group>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from '@vue/composition-api';

export default defineComponent({
  setup() {
    const state = reactive({
      routes: [
        {
          label: 'Profile',
          path: 'profile',
        },
        {
          label: 'Drafts',
          path: 'drafts',
        },
        {
          label: 'Comments',
          path: 'comments',
        },
        {
          label: 'Preferences',
          path: 'preferences',
        },
      ],
    });

    return {
      ...toRefs(state),
    };
  },
});
</script>

<style></style>
