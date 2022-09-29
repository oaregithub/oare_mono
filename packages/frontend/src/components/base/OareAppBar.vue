<template>
  <v-app-bar
    app
    dark
    height="42"
    clipped-left
    color="#002E5D"
    extension-height="42"
  >
    <v-app-bar-nav-icon @click="$emit('nav-icon-click')" />

    <div id="leftSide">
      <div id="titleBox">
        <div class="headline">
          <router-link class="white--text no_underline" to="/">{{
            title
          }}</router-link>
        </div>
      </div>
    </div>

    <v-spacer />
    <div>
      <div class="d-flex align-center">
        <div v-if="isDevelopmentEnvironment" class="mr-5 test-dev-indicator">
          <v-menu offset-y :nudge-left="66" open-on-hover>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="info" outlined>DEVELOPMENT</v-btn>
            </template>
            <v-card class="pa-5" width="270">
              <v-row class="text-center ma-0" justify="center">
                <span
                  >The website is currently running in a development
                  environment. Changes made will not affect data in the
                  production database. This environment is meant only for web
                  developers who are currently building the site.
                </span>
                <span class="mt-4"
                  >If you are not an OARE developer or this appears when
                  visiting the production website, please contact us immediately
                  at</span
                >
                <a href="mailto:oarefeedback@byu.edu">oarefeedback@byu.edu</a>
              </v-row>
            </v-card>
          </v-menu>
        </div>
        <v-badge
          v-if="isAdmin"
          :value="displayAdminBadge"
          color="error"
          overlap
          dot
          left
          class="test-admin-badge"
        >
          <v-btn
            v-if="isAdmin"
            class="mr-2 test-admin-btn"
            text
            to="/admin/groups"
            >Admin</v-btn
          >
        </v-badge>
        <v-btn
          v-if="!isAuthenticated"
          class="test-login-btn"
          text
          to="/login"
          >{{ i18n.t('appBar.login') }}</v-btn
        >
        <v-menu v-else offset-y>
          <template v-slot:activator="{ on }">
            <v-btn text v-on="on">
              {{ i18n.t('appBar.welcome') }},
              {{ firstName }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="$router.push('/dashboard/profile')">
              <v-list-item-title>Dashboard</v-list-item-title>
            </v-list-item>
            <v-list-item @click="logout">
              <v-list-item-title>{{
                i18n.t('appBar.logout')
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <template #extension>
      <v-row class="d-flex justify-center my-1">
        <v-menu
          offset-y
          open-on-hover
          v-if="canViewWords || canViewNames || canViewPlaces"
        >
          <template #activator="{ on, attrs }">
            <v-btn text dark v-bind="attrs" v-on="on"> Lexica </v-btn>
          </template>
          <v-list dense>
            <v-list-item v-if="canViewWords" class="pa-0">
              <v-btn class="test-words" text to="/words/A" width="100%"
                >Words</v-btn
              >
            </v-list-item>
            <v-list-item v-if="canViewNames" class="pa-0">
              <v-btn class="test-names" text to="/names/A" width="100%"
                >Names</v-btn
              >
            </v-list-item>
            <v-list-item v-if="canViewPlaces" class="pa-0">
              <v-btn class="test-places" text to="/places/A" width="100%"
                >Places</v-btn
              >
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn class="test-places" text to="/people/A" v-if="canViewPeople"
          >People</v-btn
        >

        <v-menu offset-y open-on-hover>
          <template #activator="{ on, attrs }">
            <v-btn class="test-texts" text dark v-bind="attrs" v-on="on"
              >Texts</v-btn
            >
          </template>
          <v-list dense>
            <v-list-item class="pa-0">
              <v-btn text to="/collections/A-J" width="100%"
                >By Collection</v-btn
              >
            </v-list-item>
            <v-list-item class="pa-0">
              <v-btn text to="/publications/A" width="100%"
                >By Publication</v-btn
              >
            </v-list-item>
            <v-list-item class="pa-0">
              <v-btn text to="/archives" width="100%">By Archive</v-btn>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn class="test-search" text to="/search/texts">Search</v-btn>

        <v-menu offset-y open-on-hover>
          <template #activator="{ on, attrs }">
            <v-btn text dark v-bind="attrs" v-on="on"> Misc. </v-btn>
          </template>
          <v-list dense>
            <v-list-item v-if="canViewBibliography" class="pa-0">
              <v-btn text to="/bibliography" width="100%">Bibliography</v-btn>
            </v-list-item>
            <v-list-item class="pa-0">
              <v-btn text to="/about" width="100%">About</v-btn>
            </v-list-item>
            <v-list-item class="pa-0">
              <v-btn text to="/tutorial" width="100%">Tutorial</v-btn>
            </v-list-item>
            <v-list-item class="pa-0">
              <v-btn text to="/signList" width="100%">Sign List</v-btn>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-row>
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import i18n from '@/i18n';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'OareAppBar',
  setup(_, context) {
    const router = sl.get('router');
    const store = sl.get('store');
    const serverProxy = sl.get('serverProxy');

    const title = computed(() => {
      if (context.root.$vuetify.breakpoint.smAndDown) {
        return 'OARE';
      }
      return i18n.t('appBar.oare');
    });

    const displayAdminBadge = computed(() =>
      Object.values(store.getters.displayAdminBadge).includes(true)
    );

    const isAdmin = computed(() => store.getters.isAdmin);
    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const firstName = computed(() =>
      store.getters.user ? store.getters.user.firstName : ''
    );
    const isDevelopmentEnvironment = computed(
      () => process.env.NODE_ENV === 'development'
    );

    const canViewWords = computed(() => store.hasPermission('WORDS'));
    const canViewNames = computed(() => store.hasPermission('NAMES'));
    const canViewPlaces = computed(() => store.hasPermission('PLACES'));
    const canViewPeople = computed(() => store.hasPermission('PEOPLE'));
    const canViewBibliography = computed(() =>
      store.hasPermission('BIBLIOGRAPHY')
    );

    const logout = () => {
      store.logout();
      router.push('/login');
      serverProxy.logout();
    };

    return {
      title,
      logout,
      isAdmin,
      isAuthenticated,
      firstName,
      displayAdminBadge,
      isDevelopmentEnvironment,
      canViewWords,
      canViewNames,
      canViewPlaces,
      canViewPeople,
      canViewBibliography,
      i18n,
    };
  },
});
</script>

<style scoped>
.no_underline {
  text-decoration: none;
}
#leftSide {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: left;
}
#titleBox {
  display: flex;
  flex-direction: column;
  align-content: center;
  margin-left: 10px;
}
</style>
