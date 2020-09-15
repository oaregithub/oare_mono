<template>
  <v-app>
    <v-navigation-drawer
      app
      dark
      clipped
      v-model="drawer"
      :mobile-breakpoint="$vuetify.breakpoint.thresholds.sm"
      color="#002E5D"
    >
      <component :is="sidebarComponent" />
    </v-navigation-drawer>
    <OareAppBar
      @nav-icon-click="drawer = !drawer"
      :store="store"
      :router="router"
    />

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import hideSidebarRoutes from './hideSidebarRoutes';
import OareSidebar from './components/base/OareSidebar/index.vue';
import defaultStore from './store';
import defaultRouter from './router';

export default defineComponent({
  name: 'App',
  components: {
    OareSidebar
  },
  setup(_, context) {
    const drawer = ref(true);
    const hasLanded = ref(false);

    const sidebarComponent = computed(() => {
      const routeName = context.root.$route.name;
      if (routeName && routeName.includes('dashboard')) {
        return 'OareDashboardSidebar';
      }
      return 'OareSidebar';
    });

    const store = computed(() => defaultStore);
    const router = computed(() => defaultRouter);

    return {
      drawer,
      hasLanded,
      sidebarComponent,
      store,
      router
    };
  }
});
</script>

<style>
* {
  font-family: 'Gentium Basic', serif;
}

.oare-header {
  font-size: 1.5rem;
}

.oare-title {
  font-size: 1.25rem;
}
</style>
