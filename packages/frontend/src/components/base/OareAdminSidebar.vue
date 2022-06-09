<template>
  <v-list-item-group dark active-class="white--text">
    <router-link
      v-for="(route, idx) in routes"
      :key="idx"
      :to="route.path"
      class="text-decoration-none"
    >
      <v-list-item :data-testid="route.label">
        <v-list-item-content>
          <v-badge
            :value="!!route.showIndicator"
            color="error"
            dot
            offset-x="10"
            inline
            class="test-admin-badge"
          >
            <v-list-item-title>{{ route.label }}</v-list-item-title>
          </v-badge>
        </v-list-item-content>
      </v-list-item>
    </router-link>
  </v-list-item-group>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  toRefs,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const store = sl.get('store');

    const state = reactive({
      routes: computed(() => [
        {
          label: 'Groups',
          path: '/admin/groups',
        },
        {
          label: 'Public Denylist',
          path: '/admin/denylist/texts',
        },
        {
          label: 'Quarantined Texts',
          path: '/admin/quarantine',
        },
        {
          label: 'Error Log',
          path: '/admin/errors',
          showIndicator: store.getters.displayAdminBadge.error,
        },
        {
          label: 'Comments',
          path: '/admin/comments',
          showIndicator: store.getters.displayAdminBadge.comments,
        },
        {
          label: 'Text Drafts',
          path: '/admin/drafts',
        },
        {
          label: 'Backend Documentation',
          path: '/admin/swagger',
        },
        {
          label: 'Properties Taxonomy',
          path: '/admin/propertiesTaxonomy',
        },
        {
          label: 'Admin Settings',
          path: '/admin/settings',
        },
      ]),
    });

    return {
      ...toRefs(state),
    };
  },
});
</script>

<style></style>
