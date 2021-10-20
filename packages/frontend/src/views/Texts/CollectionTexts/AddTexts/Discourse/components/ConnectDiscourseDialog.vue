<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    closeOnSubmit
    @submit="setSpellingUuid"
  >
    <OareContentView title="Select Lexical Form">
      <b class="mr-1">{{ word.explicitSpelling }}</b>
      <span v-if="searchSpellingResults.length > 0"
        >appears in the following lexical forms. Select the appropriate form to
        link this occurrence to the dictionary.</span
      >
      <span v-else
        >does not appear in any forms. It cannot be connect to the dictionary at
        this time.</span
      >
      <v-radio-group v-model="selectedOption">
        <v-radio
          v-for="option in searchSpellingResults"
          :key="option.spellingUuid"
          :label="option.form.form"
          :value="option.spellingUuid"
        >
        </v-radio>
      </v-radio-group>
    </OareContentView>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  PropType,
} from '@vue/composition-api';
import { SearchSpellingResultRow, TextDiscourseRow } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    word: {
      type: Object as PropType<TextDiscourseRow>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const searchSpellingResults = ref<SearchSpellingResultRow[]>([]);

    const selectedOption = ref();

    const setSpellingUuid = () => {
      emit('set-spelling-uuid', selectedOption.value);
    };

    onMounted(async () => {
      try {
        searchSpellingResults.value = await server.searchSpellings(
          props.word.explicitSpelling || ''
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading possible spellings. Please try again.'
        );
      }
    });
    return {
      searchSpellingResults,
      selectedOption,
      setSpellingUuid,
    };
  },
});
</script>