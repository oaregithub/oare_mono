<template>
  <div>
    <div class="d-flex">
      <v-btn
        v-if="canAddSpelling && !editing && allowEditing"
        icon
        class="mt-n2 mr-1"
        @click="openEditDialog(form)"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      <v-btn
        v-if="canEdit && !editing && allowEditing"
        icon
        class="test-pencil mt-n2"
        @click="editing = true"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>

      <UtilList
        v-if="!editing"
        @comment-clicked="openComment(form.uuid, form.form)"
        :hasEdit="false"
        :hasDelete="false"
        :hideMenu="!allowEditing"
      >
        <template #activator="{ on, attrs }">
          <strong
            class="mr-1 test-form-util-list"
            :class="{ 'cursor-display': allowEditing }"
            v-on="on"
            v-bind="attrs"
          >
            <mark v-if="form.uuid === uuidToHighlight">{{ form.form }}</mark>
            <mark v-else-if="form.spellings.length <= 0" class="error">{{
              form.form
            }}</mark>
            <template v-else>{{ form.form }}</template>
          </strong>
        </template>
      </UtilList>

      <div v-else class="d-flex flex-row pa-0 ml-2">
        <v-text-field
          v-model="editForm.form"
          autofocus
          class="test-edit pa-0"
          :disabled="loading"
        />
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
      </div>

      <grammar-display :form="form" />
      <span class="d-flex flex-row flex-wrap mb-0">
        <span
          class="d-flex flex-row mb-0"
          v-for="(s, index) in form.spellings"
          :key="index"
        >
          <spelling-display
            :spelling="s"
            :form="form"
            :word-uuid="wordUuid"
            :uuid-to-highlight="uuidToHighlight"
            :allow-editing="allowEditing"
          />
          <span v-if="index !== form.spellings.length - 1" class="mr-1">,</span>
        </span></span
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import { DictionaryForm } from '@oare/types';
import sl from '@/serviceLocator';
import GrammarDisplay from './components/GrammarDisplay.vue';
import SpellingDisplay from './components/SpellingDisplay.vue';
import UtilList from '@/components/UtilList/index.vue';
import EventBus, { ACTIONS } from '@/EventBus';

export default defineComponent({
  components: {
    GrammarDisplay,
    SpellingDisplay,
    UtilList,
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
    wordUuid: {
      type: String as PropType<string>,
      required: false,
    },
    uuidToHighlight: {
      type: String,
      default: null,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');

    const routeName = router.currentRoute.name;
    const spellingDialogOpen = ref(false);
    const editing = ref(false);
    const loading = ref(false);
    const isCommenting = ref(false);
    const editForm = ref({
      ...props.form,
    });
    const canEdit = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('UPDATE_FORM')
    );

    const canAddSpelling = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('ADD_SPELLING')
    );

    const saveFormEdit = async (): Promise<void> => {
      loading.value = true;
      try {
        await server.updateForm(editForm.value.uuid, {
          newForm: editForm.value.form,
        });
        props.updateForm(editForm.value);
        actions.showSnackbar('Form successfully updated');
        editing.value = false;
      } catch {
        actions.showErrorSnackbar('Error updating form');
      } finally {
        loading.value = false;
      }
    };

    const openComment = (uuid: string, word: string) => {
      EventBus.$emit(ACTIONS.COMMENT_DIALOG, {
        uuid,
        word,
      });
    };

    const openEditDialog = (form: DictionaryForm) => {
      EventBus.$emit(ACTIONS.EDIT_WORD_DIALOG, {
        form,
        allowDiscourseMode: false,
      });
    };

    return {
      isCommenting,
      editing,
      canEdit,
      canAddSpelling,
      editForm,
      loading,
      saveFormEdit,
      spellingDialogOpen,
      routeName,
      openComment,
      openEditDialog,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
