<template>
  <v-app-bar
    app
    dark
    height="50"
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
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn v-on="on" v-bind="attrs" text class="test-locale mr-2">
              <v-icon small class="mr-1">mdi-translate</v-icon>
              {{ selectedLocale.value }}
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item
              v-for="(locale, idx) in locales"
              :key="idx"
              class="pa-0"
            >
              <v-btn width="100%" text @click="setLocale(locale)"
                ><v-icon
                  small
                  class="mr-2"
                  :color="
                    selectedLocale.value === locale.value
                      ? 'black'
                      : 'transparent'
                  "
                  >mdi-check</v-icon
                >{{ locale.value.toUpperCase() }} - {{ locale.label }}</v-btn
              >
            </v-list-item>
          </v-list>
        </v-menu>
        <div v-if="isDevelopmentEnvironment" class="mr-5 test-dev-indicator">
          <v-menu offset-y open-on-hover>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="info" outlined>DEVELOPMENT</v-btn>
            </template>
            <v-card class="pa-5" width="290">
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
        <div v-if="isReadOnlyEnvironment" class="mr-5">
          <v-menu offset-y open-on-hover>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" color="red" outlined
                >READ-ONLY PRODUCTION DATABASE</v-btn
              >
            </template>
            <v-card class="pa-5" width="290">
              <v-row class="text-center ma-0" justify="center">
                <span
                  >The website is currently running in a development
                  environment, but is connected to the production read-only
                  database. Any attempted edits will throw errors and will not
                  affect production data. While in this mode, the cache is
                  disabled for all routes in order to prevent stale data
                  inconsistencies. This environment is meant only for web
                  developers who are currently building the site and need to
                  test it with production data.
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
        <v-menu
          offset-y
          open-on-hover
          v-if="canViewWords || canViewNames || canViewPlaces"
        >
          <template #activator="{ on, attrs }">
            <v-btn class="test-lexica" text dark v-bind="attrs" v-on="on">
              Lexica
            </v-btn>
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

        <v-menu offset-y open-on-hover v-if="canViewPeriods || canViewPersons">
          <template #activator="{ on, attrs }">
            <v-btn class="test-realia" text dark v-bind="attrs" v-on="on">
              Realia
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item v-if="canViewPersons" class="pa-0">
              <v-btn class="test-places" text to="/persons/A" width="100%"
                >Persons</v-btn
              >
            </v-list-item>
            <v-list-item v-if="canViewPeriods" class="pa-0">
              <v-btn class="test-periods" text to="/periods" width="100%"
                >Periods</v-btn
              >
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn class="test-search" text to="/search/texts">Search</v-btn>

        <v-menu offset-y open-on-hover>
          <template #activator="{ on, attrs }">
            <v-btn class="test-misc" text dark v-bind="attrs" v-on="on">
              Misc.
            </v-btn>
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
            <v-list-item v-if="canViewSeals" class="pa-0">
              <v-btn text to="/seals" width="100%">Seals</v-btn>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-row>
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onMounted,
} from '@vue/composition-api';
import i18n from '@/i18n';
import sl from '@/serviceLocator';
import { Locale } from '@oare/types';

export default defineComponent({
  name: 'OareAppBar',
  setup(_, context) {
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const store = sl.get('store');
    const server = sl.get('serverProxy');

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
    const isReadOnlyEnvironment = ref(false);

    const canViewWords = computed(() => store.hasPermission('WORDS'));
    const canViewNames = computed(() => store.hasPermission('NAMES'));
    const canViewPlaces = computed(() => store.hasPermission('PLACES'));
    const canViewPersons = computed(() => store.hasPermission('PERSONS'));
    const canViewBibliography = computed(() =>
      store.hasPermission('BIBLIOGRAPHY')
    );
    const canViewSeals = computed(() => store.hasPermission('SEALS'));
    const canViewPeriods = computed(() => store.hasPermission('PERIODS'));

    const logout = () => {
      store.logout();
      router.push('/login');
      server.logout();
    };

    const locales = ref<Locale[]>([
      { label: 'English', value: 'en' },
      { label: 'Türkçe', value: 'tr' },
    ]);

    const selectedLocale = ref<Locale>(
      locales.value.find(locale => locale.value === i18n.locale) ||
        locales.value[0]
    );

    const setLocale = (locale: Locale) => {
      selectedLocale.value = locale;
      localStorage.setItem('locale', selectedLocale.value.value);
      router.go(0);
    };

    onMounted(async () => {
      try {
        isReadOnlyEnvironment.value = await server.getReadOnlyStatus();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading environment info',
          err as Error
        );
      }
    });

    return {
      title,
      logout,
      isAdmin,
      isAuthenticated,
      firstName,
      displayAdminBadge,
      isDevelopmentEnvironment,
      isReadOnlyEnvironment,
      canViewWords,
      canViewNames,
      canViewPlaces,
      canViewPersons,
      canViewBibliography,
      canViewSeals,
      canViewPeriods,
      i18n,
      locales,
      selectedLocale,
      setLocale,
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
