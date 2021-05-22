<template>
  <OareCard :title="$t('register.register')">
    <v-text-field
      outline
      v-model="user.firstname"
      :label="$t('register.firstName')"
      :error-messages="formErrors.firstname"
      outlined
      class="test-firstname"
    ></v-text-field>
    <v-text-field
      outlined
      v-model="user.lastname"
      :label="$t('register.lastName')"
      :error-messages="formErrors.lastname"
      class="test-lastname"
    ></v-text-field>
    <v-text-field
      outlined
      v-model="user.email"
      :label="$t('register.email')"
      :error-messages="formErrors.email"
      class="test-email"
    ></v-text-field>
    <v-text-field
      outlined
      v-model="user.password"
      :label="$t('register.password')"
      :error-messages="formErrors.password"
      type="password"
      class="test-password"
    ></v-text-field>
    <v-text-field
      @keyup.enter="register"
      outlined
      v-model="user.repeatpassword"
      :label="$t('register.confirmPassword')"
      :error-messages="formErrors.repeatpassword"
      name="repeatpassword"
      type="password"
      class="test-confirm-password"
    ></v-text-field>
    <p class="subtitle error--text test-error-msg">{{ errorMsg }}</p>
    <v-btn text class="text-none" to="/login">
      {{ $t('register.alreadyHaveAccount') }}
    </v-btn>

    <template #actions>
      <OareLoaderButton
        color="primary"
        class="test-register-btn"
        @click="register"
        :loading="loading.registerButton"
        :disabled="Object.values(user).some(v => !v.trim())"
      >
        {{ $t('register.confirm') }}
      </OareLoaderButton>
    </template>
  </OareCard>
</template>

<script lang="ts">
import { RegisterPayload } from '@oare/types';
import { defineComponent, ref, PropType } from '@vue/composition-api';
import Router from 'vue-router';
import sl from '@/serviceLocator';
import defaultRouter from '../../../router';

export default defineComponent({
  name: 'RegisterView',
  props: {
    router: {
      type: Object as PropType<Router>,
      default: () => defaultRouter,
    },
  },
  setup({ router }) {
    const server = sl.get('serverProxy');
    const store = sl.get('store');

    const user = ref({
      email: '',
      password: '',
      repeatpassword: '',
      firstname: '',
      lastname: '',
    });

    const formErrors = ref({
      email: '',
      password: '',
      repeatpassword: '',
      firstname: '',
      lastname: '',
    });

    const errorMsg = ref('');
    const loading = ref({
      registerButton: false,
    });

    const validate = () => {
      let valid = true;
      formErrors.value = {
        email: '',
        password: '',
        repeatpassword: '',
        firstname: '',
        lastname: '',
      };

      if (user.value.repeatpassword !== user.value.password) {
        formErrors.value.repeatpassword = 'Passwords do not match';
        valid = false;
      }

      if (user.value.password.length < 8) {
        formErrors.value.password =
          'Password must be at least 8 characters long';
        valid = false;
      }

      if (!/.+@.+\..+/.test(user.value.email)) {
        formErrors.value.email = 'Email is not formatted correctly';
        valid = false;
      }

      return valid;
    };

    const register = async () => {
      loading.value.registerButton = true;

      if (!validate()) {
        loading.value.registerButton = false;
        return;
      }

      errorMsg.value = '';
      let userData: RegisterPayload = {
        firstName: user.value.firstname,
        lastName: user.value.lastname,
        password: user.value.password,
        email: user.value.email,
      };

      try {
        const user = await server.register(userData);
        store.setUser(user);
        router.push('/');
      } catch (e) {
        errorMsg.value = e.response.data.message;
      } finally {
        loading.value.registerButton = false;
      }
    };

    return {
      user,
      errorMsg,
      loading,
      register,
      formErrors,
    };
  },
});
</script>
