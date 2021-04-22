<template>
  <v-app-bar app dark clipped-left color="#002E5D">
    <v-app-bar-nav-icon @click="$emit('nav-icon-click')" />
    <div id="logo" v-if="$vuetify.breakpoint.smAndUp">
      <a href="https://byu.edu" target="_blank">
        <v-img
          src="/BYU_abbrev.png"
          class="mt-5 mx-3"
          max-height="50px"
          max-width="75px"
        />
      </a>
    </div>

    <div id="leftSide">
      <div id="titleBox">
        <div class="subtitle-1">
          <a
            class="blue-grey--text text--lighten-3 no_underline"
            href="https://history.byu.edu"
            target="_blank"
            >{{ i18n.t('appBar.historyDep') }}</a
          >
        </div>
        <div class="headline">
          <router-link class="white--text no_underline" to="/">{{
            title
          }}</router-link>
        </div>
      </div>
    </div>

    <v-spacer />
    <div>
      <v-progress-circular v-if="loading" indeterminate />
      <div class="d-flex align-center" v-else>
        <v-btn
          v-if="isAdmin"
          class="mr-2 test-admin-btn"
          text
          to="/admin/groups"
          >Admin</v-btn
        >
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
      <v-row class="d-flex justify-center">
        <v-btn
          class="test-words"
          text
          to="/words/A"
          v-if="permissions.includes('WORDS')"
          >Words</v-btn
        >
        <v-btn
          class="test-names"
          text
          to="/names/A"
          v-if="permissions.includes('NAMES')"
          >Names</v-btn
        >
        <v-btn
          class="test-places"
          text
          to="/places/A"
          v-if="permissions.includes('PLACES')"
          >Places</v-btn
        >
        <v-btn class="test-texts" text to="/collections/A-J">Texts</v-btn>
        <v-btn class="test-search" text to="/search/texts">Search</v-btn>
      </v-row>
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  PropType,
  onMounted,
} from '@vue/composition-api';
import VueI18n from 'vue-i18n';
import Router from 'vue-router';
import defaultI18n from '../../i18n/index';
import EventBus, { ACTIONS } from '@/EventBus';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'OareAppBar',
  props: {
    router: {
      type: Object as PropType<Router>,
      required: true,
    },
    i18n: {
      type: Object as PropType<VueI18n>,
      default: () => defaultI18n,
    },
  },
  setup({ router, i18n }, context) {
    const store = sl.get('store');
    const serverProxy = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);
    const title = computed(() => {
      if (context.root.$vuetify.breakpoint.smAndDown) {
        return 'OARE';
      }
      return i18n.t('appBar.oare');
    });

    const isAdmin = computed(() => store.getters.isAdmin);
    const isAuthenticated = computed(() => store.getters.isAuthenticated);
    const firstName = computed(() =>
      store.getters.user ? store.getters.user.firstName : ''
    );
    const permissions = computed(() =>
      store.getters.permissions.map(permission => permission.name)
    );

    const logout = () => {
      store.logout();
      router.push('/login');
      serverProxy.logout();
    };

    onMounted(async () => {
      loading.value = true;
      try {
        const user = await serverProxy.refreshToken();
        store.setUser(user);
        const permissions = await serverProxy.getUserPermissions();
        store.setPermissions(permissions);
      } catch (error) {
        if (!(error.response && error.response.status === 400)) {
          actions.showErrorSnackbar('There was an error initializing the site');
        }
      } finally {
        loading.value = false;
        EventBus.$emit(ACTIONS.REFRESH);
        store.setAuthComplete();
      }
    });

    return {
      title,
      logout,
      loading,
      isAdmin,
      isAuthenticated,
      firstName,
      permissions,
    };
  },
});
</script>

<style scoped>
.no_underline {
  text-decoration: none;
}
#appBarContainer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-around;
  background-color: #002e5d;
  height: 0.66in;
  align-items: center;
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
#logo {
  height: 0.66in;
}
</style>
