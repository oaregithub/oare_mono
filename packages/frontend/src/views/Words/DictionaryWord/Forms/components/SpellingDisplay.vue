<template>
  <span class="d-flex flex-row mb-0">
    <UtilList
      @comment-clicked="isCommenting = true"
      @edit-clicked="isEditing = true"
      @delete-clicked="deleteSpellingDialog = true"
      :hasEdit="canEdit"
      :hasDelete="canEdit"
    >
      <template #activator="{ on, attrs }">
        <mark v-if="spelling.uuid === uuidToHighlight">
          <span
            v-html="htmlSpelling"
            v-bind="attrs"
            v-on="on"
            class="cursor-display test-spelling"
          ></span
        ></mark>
        <span
          v-else
          v-html="htmlSpelling"
          v-bind="attrs"
          v-on="on"
          class="cursor-display test-spelling"
        ></span>
      </template>
    </UtilList>
    &nbsp;
    <span v-if="totalOccurrences > 0 || totalOccurrencesLoading">
      (<a @click="textOccurrenceDialog = true" class="test-num-texts">{{
        totalOccurrencesLoading ? 'Loading...' : totalOccurrences
      }}</a
      >)</span
    >

    <text-occurrences
      v-model="textOccurrenceDialog"
      class="test-text-occurrences-display"
      :title="spelling.spelling"
      :uuid="spelling.uuid"
      :totalTextOccurrences="totalOccurrences"
      :getTexts="server.getSpellingTextOccurrences"
      :get-texts-count="server.getSpellingTotalOccurrences"
    >
    </text-occurrences>
    <edit-word-dialog v-model="isEditing" :form="form" :spelling="spelling" />
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
    <comment-word-display
      v-model="isCommenting"
      :word="spelling.spelling"
      :uuid="spelling.uuid"
      :route="`/${routeName}/${wordUuid}`"
      >{{ spelling.spelling }}</comment-word-display
    >
  </span>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  PropType,
  inject,
  onMounted,
} from '@vue/composition-api';
import { FormSpelling, DictionaryForm } from '@oare/types';
import sl from '@/serviceLocator';
import { spellingHtmlReading } from '@oare/oare';
import SpellingDialog from './SpellingDialog.vue';
import UtilList from '@/components/UtilList/index.vue';
import TextOccurrences from './TextOccurrences.vue';
import { ReloadKey } from '../../index.vue';
import EditWordDialog from './EditWordDialog.vue';
import CommentWordDisplay from '@/components/CommentWordDisplay/index.vue';

export default defineComponent({
  components: {
    SpellingDialog,
    UtilList,
    TextOccurrences,
    EditWordDialog,
    CommentWordDisplay,
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
    wordUuid: {
      type: String,
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
    const totalOccurrences = ref(0);
    const totalOccurrencesLoading = ref(false);

    const canEdit = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('UPDATE_FORM')
    );

    const htmlSpelling = computed(() =>
      spellingHtmlReading(props.spelling.spelling)
    );

    const deleteSpelling = async () => {
      try {
        await server.removeSpelling(props.spelling.uuid);
        actions.showSnackbar('Successfully removed spelling');
        reload && reload();
      } catch {
        actions.showErrorSnackbar('Failed to delete spelling');
      } finally {
        deleteSpellingDialog.value = false;
      }
    };

    onMounted(async () => {
      try {
        totalOccurrencesLoading.value = true;
        totalOccurrences.value = await server.getSpellingTotalOccurrences(
          props.spelling.uuid
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading spelling occurrences. Please try again.'
        );
      } finally {
        totalOccurrencesLoading.value = false;
      }
    });

    return {
      server,
      textOccurrenceDialog,
      deleteLoading,
      canEdit,
      isEditing,
      isCommenting,
      htmlSpelling,
      totalOccurrences,
      totalOccurrencesLoading,
      deleteSpellingDialog,
      deleteSpelling,
      routeName,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
