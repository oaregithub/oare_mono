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
    <OareAppBar @nav-icon-click="drawer = !drawer" :router="router" />

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <OareSnackbar />
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import OareSidebar from './components/base/OareSidebar/index.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'App',
  components: {
    OareSidebar,
  },
  setup(_, context) {
    /**
     * Indicates whether the drawer is open or not
     */
    const drawer = ref(true);

    /**
     * The sidebar component to render.
     * Which sidebar to display is determined by the current route name.
     */
    const sidebarComponent = computed(() => {
      const routeName = context.root.$route.name;
      if (routeName && routeName.includes('dashboard')) {
        return 'OareDashboardSidebar';
      } else if (
        routeName &&
        (routeName.includes('admin') ||
          routeName.includes('manage') ||
          routeName.includes('denylist'))
      ) {
        return 'OareAdminSidebar';
      }
      return 'OareSidebar';
    });

    /**
     * The router instance
     */
    const router = sl.get('router');

    return {
      drawer,
      sidebarComponent,
      router,
    };
  },
});
</script>

<style>
* {
  font-family: 'Gentium Basic', serif;
}

@font-face {
  font-family: 'Santakku';
  src: local('Santakku'), url('./assets/fonts/Santakku.ttf') format('truetype');
}

@font-face {
  font-family: 'CuneiformComposite';
  src: local('CuneiformComposite'),
    url('./assets/fonts/CuneiformComposite.ttf') format('truetype');
}

.oare-header {
  font-size: 1.5rem;
}

.oare-title {
  font-size: 1.25rem;
}
</style>
