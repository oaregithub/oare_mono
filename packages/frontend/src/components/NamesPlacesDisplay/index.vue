<template>
  <DictionaryDisplay
    :wordList="wordList"
    :letter="letter"
    :route="route"
    :searchFilter="searchFilter"
  >
    <template #translation="{ word }" v-if="route === 'names'">
      <div>
        {{ word.translation || '(no trans.)' }}
      </div>
    </template>

    <template #forms="{ word }">
      <div
        v-for="(formInfo, idx) in word.forms"
        :key="idx"
        class="d-flex flex-wrap pl-4"
      >
        <em class="font-weight-bold mr-1">{{ formInfo.form }}</em>
        <div class="mr-1">({{ formInfo.cases }})</div>
        <div v-for="(spelling, idx) in formInfo.spellings" :key="idx">
          <span v-if="idx > 0">, </span>
          <span v-html="spellingHtmlReading(spelling)"></span>
        </div>
      </div>
    </template>
  </DictionaryDisplay>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { NameOrPlace } from '@oare/types';
import DictionaryDisplay from '../DictionaryDisplay/index.vue';
import { spellingHtmlReading } from '@oare/oare';

export default defineComponent({
  name: 'NamesPlacesDisplay',
  components: {
    DictionaryDisplay,
  },
  props: {
    wordList: {
      type: Array as PropType<NameOrPlace[]>,
    },
    letter: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
  },

  setup() {
    const searchFilter = (search: string, word: NameOrPlace) => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        word.word.toLowerCase().includes(lowerSearch) ||
        (word.translation &&
          word.translation.toLowerCase().includes(lowerSearch)) ||
        word.forms.some(form => {
          return (
            form.form &&
            (form.form.toLowerCase().includes(lowerSearch) ||
              form.spellings.some(spelling => {
                return spelling && spelling.toLowerCase().includes(lowerSearch);
              }))
          );
        })
      );
    };

    return {
      searchFilter,
      spellingHtmlReading,
    };
  },
});
</script>

<style></style>
