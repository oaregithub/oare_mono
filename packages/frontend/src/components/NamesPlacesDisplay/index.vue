<template>
  <span>
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
          <UtilList
            @clicked-commenting="isCommented"
            :has-edit="false"
            :has-delete="false"
            :word="formInfo.form"
            :route="`/dictionaryWord/${word.uuid}`"
            :uuid="formInfo.uuid"
            :mark-word="true"
          >
            <em class="font-weight-bold mr-1">{{ formInfo.form }}</em>
          </UtilList>

          <div class="mr-1">({{ formInfo.cases }})</div>
          <div
            v-for="(spelling, idx) in formInfo.spellings"
            :key="idx"
            class="d-flex"
          >
            <span v-if="idx > 0" class="mr-1">, </span>
            <UtilList
              @clicked-commenting="isCommented"
              :has-edit="false"
              :has-delete="false"
              :word="spelling.explicitSpelling"
              :route="`/dictionaryWord/${word.uuid}`"
              :uuid="spelling.uuid"
              :mark-word="true"
            >
              <span
                v-html="correctedHtmlSpelling(spelling.explicitSpelling)"
              ></span>
            </UtilList>
          </div>
        </div>
      </template>
    </DictionaryDisplay>
    <CommentWordDisplay
      v-if="isCommenting"
      :route="selectedRoute"
      :uuid="selectedUuid"
      :word="selectedWord"
      @submit="isCommenting = false"
      @input="isCommenting = false"
      ><em class="font-weight-bold mr-1">{{
        selectedWord
      }}</em></CommentWordDisplay
    >
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { NameOrPlace } from '@oare/types';
import DictionaryDisplay from '../DictionaryDisplay/index.vue';
import CommentWordDisplay from '../CommentWordDisplay/index.vue';
import UtilList from '../../components/UtilList/index.vue';
import { spellingHtmlReading } from '@oare/oare';

export default defineComponent({
  name: 'NamesPlacesDisplay',
  components: {
    DictionaryDisplay,
    CommentWordDisplay,
    UtilList,
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

  setup(props, { emit }) {
    const isCommenting = ref(false);
    const selectedWord = ref('');
    const selectedUuid = ref('');
    const selectedRoute = ref('');
    const correctedHtmlSpelling = (spelling: string) => {
      let rawHtml = spellingHtmlReading(spelling);
      const firstLetterIndex = rawHtml.indexOf('<em>') + 4;
      return rawHtml.replace(
        rawHtml.charAt(firstLetterIndex),
        rawHtml.charAt(firstLetterIndex).toUpperCase()
      );
    };

    const isCommented = (word: string, uuid: string, route: string) => {
      isCommenting.value = true;
      selectedWord.value = word;
      selectedUuid.value = uuid;
      selectedRoute.value = route;
    };

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
                return (
                  spelling &&
                  spelling.explicitSpelling.toLowerCase().includes(lowerSearch)
                );
              }))
          );
        })
      );
    };

    return {
      isCommented,
      selectedWord,
      selectedUuid,
      selectedRoute,
      isCommenting,
      searchFilter,
      correctedHtmlSpelling,
    };
  },
});
</script>
