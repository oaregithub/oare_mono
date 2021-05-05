<template>
  <span class="d-flex flex-row mb-0">
    <mark v-if="spelling.uuid === uuidToHighlight">
      <span
        v-if="canEdit && allowEditing"
        @click="openUtilList"
        class="testing-spelling"
        :class="{ 'cursor-display': cursor }"
        v-html="htmlSpelling"
      ></span>
      <span v-else v-html="htmlSpelling" class="test-spelling"></span>
    </mark>
    <template v-else>
      <span
        v-if="canEdit && allowEditing"
        @click="openUtilList"
        class="testing-spelling"
        :class="{ 'cursor-display': cursor }"
        v-html="htmlSpelling"
      ></span>
      <span v-else v-html="htmlSpelling" class="test-spelling"></span>
    </template>

    <span v-if="totalOccurrences > 0 || totalOccurrencesLoading">
      (<a @click="addSpellingDialog = true" class="test-num-texts">{{
        totalOccurrencesLoading ? 'Loading...' : totalOccurrences
      }}</a
      >)</span
    >

    <text-occurrences
      v-if="addSpellingDialog"
      :title="spelling.spelling"
      :uuid="spelling.uuid"
      :totalTextOccurrences="totalOccurrences"
      :getTexts="server.getSpellingTextOccurrences"
      :default-page-size="false"
      @input="addSpellingDialog = false"
    >
    </text-occurrences>
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
import { SendUtilList } from '../../index.vue';
import SpellingDialog from './SpellingDialog.vue';
import UtilList from '@/components/UtilList/index.vue';
import TextOccurrences from './TextOccurrences.vue';

export default defineComponent({
  components: {
    SpellingDialog,
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
    wordUuid: {
      type: String,
      required: true,
    },
    uuidToHighlight: {
      type: String,
      default: null,
    },
    cursor: {
      type: Boolean,
      default: true,
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
    const utilList = inject(SendUtilList);

    const addSpellingDialog = ref(false);
    const showUtilList = ref(false);
    const deleteLoading = ref(false);
    const isEditing = ref(false);
    const isCommenting = ref(false);
    const editLoading = ref(false);
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

    const openUtilList = () => {
      utilList &&
        utilList({
          comment: true,
          edit: true,
          delete: true,
          word: props.spelling.spelling,
          uuid: props.spelling.uuid,
          route: `/dictionaryWord/${props.wordUuid}`,
          type: 'SPELLING',
          form: props.form,
          formSpelling: props.spelling,
        });
    };

    return {
      server,
      openUtilList,
      showUtilList,
      addSpellingDialog,
      deleteLoading,
      canEdit,
      isEditing,
      isCommenting,
      editLoading,
      htmlSpelling,
      totalOccurrences,
      totalOccurrencesLoading,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
