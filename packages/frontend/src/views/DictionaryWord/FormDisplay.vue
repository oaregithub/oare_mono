<template>
  <div>
    <div v-if="!editing" class="d-flex">
      <v-btn
        v-if="canAddSpelling && !editing"
        icon
        class="mt-n2 mr-1"
        @click="spellingDialogOpen = true"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn
        v-if="canEdit"
        icon
        class="test-pencil mt-n2"
        @click="editing = true"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
      <strong>{{ form.form }}</strong>
      <grammar-display :form="form" />
      <span>
        <span v-for="(s, index) in form.spellings" :key="index">
          <spelling-display
            :spelling="s"
            :updateSpelling="newSpelling => updateSpelling(index, newSpelling)"
          />
          <span v-if="index !== form.spellings.length - 1" class="mr-1">,</span>
        </span></span
      >
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
        <grammar-display :form="form" class="mt-2" />
        <span class="mt-2">
          <span v-for="(s, index) in form.spellings" :key="index">
            <spelling-display
              :spelling="s"
              :updateSpelling="
                newSpelling => updateSpelling(index, newSpelling)
              "
            />
            <span v-if="index !== form.spellings.length - 1" class="mr-1"
              >,</span
            >
          </span></span
        >
      </v-row>
    </div>

    <add-spelling-dialog v-model="spellingDialogOpen" :form="form" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import { DictionaryForm, FormSpelling, SpellingText } from '@oare/types';
import sl from '@/serviceLocator';
import GrammarDisplay from './GrammarDisplay.vue';
import SpellingDisplay from './SpellingDisplay.vue';
import AddSpellingDialog from './AddSpellingDialog.vue';

export default defineComponent({
  components: {
    GrammarDisplay,
    SpellingDisplay,
    AddSpellingDialog,
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

    const spellingDialogOpen = ref(false);
    const editing = ref(false);
    const loading = ref(false);
    const editForm = ref({
      ...props.form,
    });
    const canEdit = computed(() =>
      store.getters.permissions.dictionary.includes('UPDATE_FORM')
    );

    const canAddSpelling = computed(() =>
      store.getters.permissions.dictionary.includes('ADD_SPELLING')
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

    const updateSpelling = (index: number, newSpelling: FormSpelling) => {
      const spellings = [...props.form.spellings];
      spellings[index] = newSpelling;
      props.updateForm({
        ...props.form,
        spellings,
      });
    };

    return {
      editing,
      canEdit,
      canAddSpelling,
      editForm,
      loading,
      saveFormEdit,
      updateSpelling,
      spellingDialogOpen,
    };
  },
});
</script>
