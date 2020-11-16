<template>
  <div>
    <div v-if="!editing" class="d-flex">
      <v-btn
        v-if="canEdit"
        icon
        class="test-pencil mt-n2"
        @click="editing = true"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
      <strong>{{ form.form }}</strong>
      <grammar-display :form="form" :updateForm="updateForm" />
    </div>

    <div v-else>
      <v-row class="pa-0 ml-2">
        <v-col cols="4" class="pa-0">
          <v-text-field
            v-model="editForm.form"
            autofocus
            class="test-edit pa-0"
            :disabled="loading"
          />
        </v-col>
        <v-progress-circular
          size="20"
          v-if="loading"
          indeterminate
          color="#757575"
          class="mt-3"
        />
        <v-btn v-if="!loading" icon @click="saveFormEdit" class="test-check">
          <v-icon>mdi-check</v-icon>
        </v-btn>
        <v-btn v-if="!loading" icon @click="editing = false" class="test-close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <grammar-display :form="form" class="mt-2" :updateForm="updateForm" />
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import { DictionaryForm } from '@oare/types';
import sl from '@/serviceLocator';
import GrammarDisplay from './GrammarDisplay.vue';

export default defineComponent({
  components: {
    GrammarDisplay,
  },
  props: {
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    updateForm: {
      type: Function as PropType<(newForm: DictionaryForm) => void>,
      required: true,
    },
  },
  setup(props) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editing = ref(false);
    const loading = ref(false);
    const editForm = ref({
      ...props.form,
    });
    const canEdit = computed(() =>
      store.getters.permissions.dictionary.includes('UPDATE_FORM')
    );

    const saveFormEdit = async (): Promise<void> => {
      loading.value = true;
      try {
        await server.updateForm(editForm.value);
        props.updateForm(editForm.value);
        actions.showSnackbar('Form successfully updated');
        editing.value = false;
      } catch {
        actions.showErrorSnackbar('Error updating form');
      } finally {
        loading.value = false;
      }
    };

    return {
      editing,
      canEdit,
      editForm,
      loading,
      saveFormEdit,
    };
  },
});
</script>

<style></style>
