<template>
  <v-card class="mt-12 pa-3 mx-auto" max-width="600" elevation="24">
    <v-card-title>
      <h3 class="oare-header mb-2">{{ $t('login.signIn') }}</h3>
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="email"
        class="test-email"
        :label="$t('login.email')"
        outlined
      />
      <v-text-field
        class="test-password"
        outlined
        @keyup.enter="logIn"
        v-model="password"
        :label="$t('login.password')"
        type="password"
      />
      <p class="subtitle error--text test-error-text">{{ errorMsg }}</p>
      <v-btn text class="text-none" to="/register">{{
        $t('login.dontHaveAccount')
      }}</v-btn>
      <br />
    </v-card-text>

    <v-card-actions>
      <OareLoaderButton
        class="text-right test-signin-btn"
        @click="logIn"
        color="primary"
        :loading="loadings.signInButton"
        :disabled="!email || !password"
      >
        {{ $t('login.signIn') }}
      </OareLoaderButton>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, PropType } from '@vue/composition-api';
import { NavigationGuard } from 'vue-router';
import sl from '@/serviceLocator';
import i18n from '../i18n';
import defaultRouter from '../router';
import Router from 'vue-router';

export interface FormRef {
  validate: () => void;
}

const beforeRouteEnter: NavigationGuard = (to, from, next) => {
  next(() => {
    const store = sl.get('store');
    if (store.getters.isAuthenticated) {
      defaultRouter.push('/');
    }
  });
};

export default defineComponent({
  name: 'LoginView',
  props: {
    router: {
      type: Object as PropType<Router>,
      default: () => defaultRouter,
    },
  },
  beforeRouteEnter,
  setup({ router }) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');

    const email = ref('');
    const password = ref('');
    const errorMsg = ref('');
    const loadings = ref({ signInButton: false });

    const logIn = async () => {
      loadings.value.signInButton = true;
      errorMsg.value = '';
      let userData = {
        email: email.value,
        password: password.value,
      };

      try {
        let response = await server.login(userData);
        store.setUser(response);
        router.push('/');
      } catch (err) {
        errorMsg.value = err.response.data.message;
      } finally {
        loadings.value.signInButton = false;
      }
    };

    return {
      email,
      password,
      errorMsg,
      loadings,
      logIn,
    };
  },
});
</script>
