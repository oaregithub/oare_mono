<template>
  <OareUserCard :title="$t('register.register')">
    <template v-slot>
      <v-form v-model="valid" ref="form">
        <v-text-field
          outline
          v-model="user.firstname"
          :label="$t('register.firstName')"
          :rules="rules.firstName"
          outlined
          data-first-name-tf
        ></v-text-field>
        <v-text-field
          outlined
          v-model="user.lastname"
          :rules="rules.lastName"
          :label="$t('register.lastName')"
          data-last-name-tf
        ></v-text-field>
        <v-text-field
          outlined
          v-model="user.email"
          :rules="rules.email"
          :label="$t('register.email')"
          data-email-tf
        ></v-text-field>
        <v-text-field
          outlined
          v-model="user.password"
          :rules="rules.password"
          :label="$t('register.password')"
          type="password"
          data-pass-tf
        ></v-text-field>
        <v-text-field
          @keyup.enter="register"
          outlined
          v-model="user.repeatpassword"
          :rules="rules.repeatPassword"
          :label="$t('register.confirmPassword')"
          name="repeatpassword"
          type="password"
          data-rep-pass-tf
        ></v-text-field>
        <p class="subtitle error--text">{{ errorMsg }}</p>
      </v-form>
      <v-btn text class="text-none" to="/login">
        {{ $t("register.alreadyHaveAccount") }}
      </v-btn>
    </template>

    <template v-slot:actions>
      <OareLoaderButton
        color="primary"
        @click="register"
        :loading="loading.registerButton"
      >
        {{ $t("register.confirm") }}
      </OareLoaderButton>
    </template>
  </OareUserCard>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, PropType } from "@vue/composition-api";
import Router from "vue-router";
import { Store } from "vuex";
import i18n from "../i18n";
import defaultStore from "../store";
import defaultRouter from "../router";

export interface FormRef {
  validate: () => void;
}

export default defineComponent({
  name: "RegisterView",
  props: {
    router: {
      type: Object as PropType<Router>,
      default: () => defaultRouter,
    },
    store: {
      type: Object as PropType<Store<{}>>,
      default: () => defaultStore,
    },
  },
  setup({ store, router }) {
    const valid = ref(false);
    const user = ref({
      email: "",
      username: "",
      password: "",
      repeatpassword: "",
      firstname: "",
      lastname: "",
    });

    const rules = ref({
      firstName: [
        (v: string) => !!v.trim() || i18n.t("register.firstNameError"),
      ],
      lastName: [(v: string) => !!v.trim() || i18n.t("register.lastNameError")],
      email: [
        (v: string) => !!v.trim() || i18n.t("register.emailBlankError"),
        (v: string) =>
          /.+@.+\..+/.test(v) || i18n.t("register.emailValidError"),
      ],
      password: [
        (v: string) => !!v || i18n.t("register.passwordRequiredError"),
        (v: string) => v.length >= 8 || i18n.t("register.passwordShortError"),
      ],
      repeatPassword: [
        (v: string) => !!v || i18n.t("register.confirmPasswordRequiredError"),
        (v: string) =>
          v === user.value.password ||
          i18n.t("register.confirmPasswordMatchError"),
      ],
    });

    const errorMsg = ref("");
    const loading = ref({
      registerButton: false,
    });

    const form: Ref<FormRef | null> = ref(null);

    const register = async () => {
      loading.value.registerButton = true;

      if (form.value) {
        form.value.validate();
      }
      if (!valid.value) {
        errorMsg.value = String(i18n.t("register.requiredField"));
        loading.value.registerButton = false;
        return;
      }
      errorMsg.value = "";
      let userData = {
        first_name: user.value.firstname,
        last_name: user.value.lastname,
        password: user.value.password,
        email: user.value.email,
      };

      try {
        await store.dispatch("register", userData);
        router.push("/");
      } catch (e) {
        errorMsg.value = e;
      } finally {
        loading.value.registerButton = false;
      }
    };

    return {
      valid,
      user,
      rules,
      errorMsg,
      loading,
      register,
    };
  },
});
</script>
