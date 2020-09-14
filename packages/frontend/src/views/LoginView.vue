<template>
  <v-card class="mt-12 pa-3 mx-auto" max-width="600" elevation="24">
    <v-card-title>
      <h3 class="oare-header mb-2">{{ $t("login.signIn") }}</h3>
    </v-card-title>
    <v-card-text>
      <v-form v-model="valid" ref="form">
        <v-text-field
          v-model="email"
          class="emailField"
          :rules="emailRules"
          :label="$t('login.email')"
          outlined
          data-login-email
        />
        <v-text-field
          class="passwordField"
          outlined
          @keyup.enter="logIn"
          v-model="password"
          :rules="passwordRules"
          :label="$t('login.password')"
          type="password"
          data-login-password
        />
      </v-form>
      <p class="subtitle error--text">{{ errorMsg }}</p>
      <v-btn text class="text-none" to="/register">{{
        $t("login.dontHaveAccount")
      }}</v-btn>
      <br />
    </v-card-text>

    <v-card-actions>
      <OareLoaderButton
        class="text-right loginBtn"
        @click="logIn"
        color="primary"
        :loading="loadings.signInButton"
      >
        {{ $t("login.signIn") }}
      </OareLoaderButton>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from "@vue/composition-api";
import { NavigationGuard } from "vue-router";
import i18n from "../i18n";
import store from "../store";
import router from "../router";

export interface FormRef {
  validate: () => void;
}

const beforeRouteEnter: NavigationGuard = (to, from, next) => {
  next(() => {
    if (store.getters.isAuthenticated) {
      router.push("/");
    }
  });
};

export default defineComponent({
  name: "LoginView",

  beforeRouteEnter,
  setup() {
    const valid = ref(false);
    const email = ref("");
    const password = ref("");
    const errorMsg = ref("");
    const emailRules = ref([(v: string) => !!v || i18n.t("login.emailError")]);
    const passwordRules = ref([
      (v: string) => !!v || i18n.t("login.passwordError"),
    ]);
    const loadings = ref({ signInButton: false });
    const form: Ref<null | FormRef> = ref(null);

    const logIn = async () => {
      loadings.value.signInButton = true;
      if (form.value) {
        form.value.validate();
      }
      if (!valid.value) {
        errorMsg.value = "Please fill in all required fields.";
        loadings.value.signInButton = false;
        return;
      }
      errorMsg.value = "";
      let userData = {
        email: email.value,
        password: password.value,
      };

      try {
        await store.dispatch("login", userData);
        router.push("/");
      } catch (err) {
        errorMsg.value = err;
      }
      loadings.value.signInButton = false;
    };

    return {
      valid,
      email,
      password,
      errorMsg,
      emailRules,
      passwordRules,
      loadings,
      form,
      logIn,
    };
  },
});
</script>
