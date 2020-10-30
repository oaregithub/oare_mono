<template>
  <div>
    <div v-for="(form, index) in forms" :key="index">
      <div v-if="!isFormBeingEdited(index)" class="d-flex">
        <v-btn
          v-if="canEditForm"
          icon
          class="test-pencil mt-n2"
          @click="setFormEditing(index)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <strong>{{ form.form }}</strong>
        <span class="mx-1" v-if="formGrammar(form).trim() !== ''"
          >({{ formGrammar(form) }})</span
        >
        <span>{{ form.spellings.map(sp => sp.spelling).join(', ') }}</span>
      </div>

      <v-row v-else class="pa-0 ml-2">
        <v-col cols="4" class="pa-0">
          <v-text-field
            v-model="editingForms[index].form"
            autofocus
            class="test-edit pa-0"
            :disabled="isFormSaveLoading(index)"
          />
        </v-col>
        <v-progress-circular
          size="20"
          v-if="isFormSaveLoading(index)"
          indeterminate
          color="#757575"
          class="mt-3"
        />
        <v-btn
          v-if="!isFormSaveLoading(index)"
          icon
          @click="saveFormEdit(index)"
          class="test-check"
        >
          <v-icon>mdi-check</v-icon>
        </v-btn>
        <v-btn
          v-if="!isFormSaveLoading(index)"
          icon
          @click="cancelFormEdit(index)"
          class="test-close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  Ref,
  computed,
} from '@vue/composition-api';
import { DictionaryForm } from '@oare/types';
import sl from '@/serviceLocator';
import permissions from '@/serverProxy/permissions';

export default defineComponent({
  props: {
    forms: {
      type: Array as PropType<DictionaryForm[]>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const editingForms: Ref<Record<number, DictionaryForm>> = ref({});
    const loadingForms: Ref<Record<number, boolean>> = ref({});

    const cancelFormEdit = (index: number): void => {
      const updatedEditingForms = {
        ...editingForms.value,
      };
      delete updatedEditingForms[index];

      editingForms.value = updatedEditingForms;
    };

    const saveFormEdit = async (index: number): Promise<void> => {
      loadingForms.value = {
        ...loadingForms.value,
        [index]: true,
      };

      try {
        const updatedForm = editingForms.value[index];
        await server.updateForm(updatedForm);
        emit('update:forms', [
          ...props.forms.slice(0, index),
          updatedForm,
          ...props.forms.slice(index + 1),
        ]);

        cancelFormEdit(index);
        actions.showSnackbar('Form successfully updated');
      } catch {
        actions.showErrorSnackbar('Error updating form');
      } finally {
        loadingForms.value = {
          ...loadingForms.value,
          [index]: false,
        };
      }
    };

    const setFormEditing = (index: number): void => {
      editingForms.value = {
        ...editingForms.value,
        [index]: props.forms[index],
      };
    };

    const isFormBeingEdited = (index: number): boolean =>
      !!editingForms.value[index];

    const isFormSaveLoading = (index: number): boolean =>
      !!loadingForms.value[index];

    const formGrammar = (form: DictionaryForm) => {
      let suffix = '';

      if (form.suffix) {
        suffix =
          form.suffix.persons.join('') +
          form.suffix.genders.join('') +
          form.suffix.grammaticalNumbers.join('') +
          form.suffix.cases.join('');
        if (form.clitics.includes('-ma')) {
          suffix += '-ma';
        }
      }
      return (
        form.stems.join('') +
        form.morphologicalForms
          .filter(mf => mf === 'stv.' || mf === 'inf')
          .join('') +
        form.tenses.join('') +
        ' ' +
        form.persons.join('') +
        form.genders.join('') +
        form.grammaticalNumbers.join('') +
        form.cases.join('') +
        ' ' +
        form.states.join('') +
        form.moods.join('') +
        form.clitics
          .map(clitic => {
            if (clitic === 'suf.') return '+';
            if (clitic === 'vent') return '+vent';
            return clitic;
          })
          .filter(clitic => clitic !== '-ma')
          .join('') +
        suffix
      );
    };

    return {
      isFormBeingEdited,
      isFormSaveLoading,
      saveFormEdit,
      setFormEditing,
      editingForms,
      cancelFormEdit,
      canEditForm: computed(() =>
        store.getters.permissions.dictionary.includes('UPDATE_FORM')
      ),
      formGrammar,
    };
  },
});
</script>
