<template>
  <span class="d-flex flex-row mb-0">
    <UtilList
      @comment-clicked="openComment(spelling.uuid, spelling.spelling)"
      @edit-clicked="openEditDialog(form, spelling)"
      @delete-clicked="deleteSpellingDialog = true"
      :hasEdit="canEdit"
      :hasDelete="canEdit"
      :hideMenu="!allowEditing"
    >
      <template #activator="{ on, attrs }">
        <mark v-if="spelling.uuid === uuidToHighlight">
          <span
            v-html="spelling.htmlSpelling"
            v-bind="attrs"
            v-on="on"
            class="test-spelling"
            :class="{ 'cursor-display': allowEditing }"
          ></span
        ></mark>
        <span
          v-else-if="!spelling.hasOccurrence"
          v-html="
            `<mark class=&quot;error&quot;>${spelling.htmlSpelling}</mark>`
          "
          v-bind="attrs"
          v-on="on"
          class="test-spelling"
          :class="{ 'cursor-display': allowEditing }"
        ></span>
        <span
          v-else
          v-html="spelling.htmlSpelling"
          v-bind="attrs"
          v-on="on"
          class="test-spelling"
          :class="{ 'cursor-display': allowEditing }"
        ></span>
      </template>
    </UtilList>
    &nbsp;
    <span v-if="spelling.hasOccurrence">
      (<a @click="textOccurrenceDialog = true" class="test-num-texts">{{
        spellingOccurrencesCount !== null
          ? spellingOccurrencesCount
          : 'Loading...'
      }}</a
      >)</span
    >
    <text-occurrences
      v-if="textOccurrenceDialog"
      v-model="textOccurrenceDialog"
      class="test-text-occurrences-display"
      :title="spelling.spelling"
      :spellingUuids="[spelling.uuid]"
      :totalTextOccurrences="spellingOccurrencesCount || 0"
      :getTexts="server.getSpellingOccurrencesTexts"
      :getTextsCount="server.getSpellingOccurrencesCounts"
    />
    <OareDialog
      v-model="deleteSpellingDialog"
      title="Delete spelling"
      submitText="Yes, delete"
      cancelText="No, don't delete"
      :persistent="false"
      @submit="deleteSpelling"
      :submitLoading="deleteLoading"
    >
      Are you sure you want to delete the spelling {{ spelling.spelling }} from
      this form? This action cannot be undone.
    </OareDialog>
  </span>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  PropType,
  inject,
} from '@vue/composition-api';
import { FormSpelling, DictionaryForm } from '@oare/types';
import sl from '@/serviceLocator';
import UtilList from '@/components/UtilList/index.vue';
import TextOccurrences from './TextOccurrences.vue';
import { ReloadKey } from '../../../../../index.vue';
import EventBus, { ACTIONS } from '@/EventBus';

export default defineComponent({
  components: {
    UtilList,
    TextOccurrences,
  },
  props: {
    spelling: {
      type: Object as PropType<FormSpelling>,
      required: true,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    uuidToHighlight: {
      type: String,
      default: null,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
    spellingOccurrencesCount: {
      type: Number,
      default: null,
    },
  },
  setup(props) {
    const _ = sl.get('lodash');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const reload = inject(ReloadKey);
    const router = sl.get('router');

    const routeName = router.currentRoute.name;

    const textOccurrenceDialog = ref(false);
    const deleteSpellingDialog = ref(false);
    const deleteLoading = ref(false);
    const isEditing = ref(false);
    const isCommenting = ref(false);

    const canEdit = computed(() => store.hasPermission('UPDATE_FORM'));

    const deleteSpelling = async () => {
      try {
        await server.removeSpelling(props.spelling.uuid);
        actions.showSnackbar('Successfully removed spelling');
        reload && reload();
      } catch (err) {
        actions.showErrorSnackbar('Failed to delete spelling', err as Error);
      } finally {
        deleteSpellingDialog.value = false;
      }
    };

    const openComment = (uuid: string, word: string) => {
      EventBus.$emit(ACTIONS.COMMENT_DIALOG, {
        uuid,
        word,
      });
    };

    const openEditDialog = (form: DictionaryForm, spelling: FormSpelling) => {
      EventBus.$emit(ACTIONS.EDIT_WORD_DIALOG, {
        form,
        spelling,
        allowDiscourseMode: true,
      });
    };

    return {
      server,
      textOccurrenceDialog,
      deleteLoading,
      canEdit,
      isEditing,
      isCommenting,
      deleteSpellingDialog,
      deleteSpelling,
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
