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
      <v-menu>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" light icon small>
            <span class="flag-icon" :class="`flag-icon-${i18n.locale}`"></span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="i18n.locale = 'us'">
            <v-list-item-title>
              <span class="flag-icon" :class="`flag-icon-us`"></span> US
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="i18n.locale = 'tr'">
            <v-list-item-title>
              <span class="flag-icon" :class="`flag-icon-tr`"></span> TR
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn
        v-if="$store.getters.isAdmin"
        class="mr-2 test-admin-btn"
        text
        to="/admin"
        >Admin</v-btn
      >
      <v-btn
        v-if="!$store.getters.isAuthenticated"
        class="test-login-btn"
        text
        to="/login"
        >{{ i18n.t('appBar.login') }}</v-btn
      >
      <v-menu v-else offset-y>
        <template v-slot:activator="{ on }">
          <v-btn text v-on="on">
            {{ i18n.t('appBar.welcome') }},
            {{ $store.getters.user.firstName }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="$router.push('/dashboard/profile')">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>{{ i18n.t('appBar.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <template #extension>
      <v-row class="d-flex justify-center">
        <v-btn
          class="test-words"
          text
          to="/words/A"
          v-if="$store.getters.isAdmin"
          >Words</v-btn
        >
        <v-btn
          class="test-names"
          text
          to="/names/A"
          v-if="$store.getters.isAdmin"
          >Names</v-btn
        >
        <v-btn
          class="test-places"
          text
          to="/places/A"
          v-if="$store.getters.isAdmin"
          >Places</v-btn
        >
        <v-btn class="test-texts" text to="/collections/A-J">Texts</v-btn>
        <v-btn class="test-search" text to="/search/texts">Search</v-btn>
      </v-row>
    </template>
  </v-app-bar>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from '@vue/composition-api';
import VueI18n from 'vue-i18n';
import { Store } from 'vuex';
import Router from 'vue-router';
import defaultI18n from '../../i18n/index';
import serverProxy from '@/serverProxy';

export default defineComponent({
  name: 'OareAppBar',
  props: {
    store: {
      type: Object as PropType<Store<{}>>,
      required: true,
    },
    router: {
      type: Object as PropType<Router>,
      required: true,
    },
    i18n: {
      type: Object as PropType<VueI18n>,
      default: () => defaultI18n,
    },
  },
  setup({ store, router, i18n }, context) {
    const title = computed(() => {
      if (context.root.$vuetify.breakpoint.smAndDown) {
        return 'OARE';
      }
      return i18n.t('appBar.oare');
    });
    const logout = () => {
      store.dispatch('logout');
      router.push('/login');
      serverProxy.logout();
    };

    return {
      title,
      logout,
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
