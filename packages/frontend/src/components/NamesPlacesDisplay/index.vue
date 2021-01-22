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
        <UtilList
          @clicked-commenting="isCommenting = true"
          :has-edit="false"
          :has-delete="false"
          :word="formInfo.form"
          :mark-word="true"
        >
          <em class="font-weight-bold mr-1">{{ formInfo.form }}</em>
        </UtilList>

        <CommentWordDisplay
          v-model="isCommenting"
          :route="`/dictionaryWord/${word.uuid}`"
          :uuid="formInfo.uuid"
          :word="formInfo.form"
          @submit="isCommenting = false"
          @input="isCommenting = false"
          ><em class="font-weight-bold mr-1">{{
            formInfo.form
          }}</em></CommentWordDisplay
        >
        <div class="mr-1">({{ formInfo.cases }})</div>
        <div
          v-for="(spelling, idx) in formInfo.spellings"
          :key="idx"
          class="spelling-container"
        >
          <span v-if="idx > 0" class="spelling-container-space">, </span>
          <UtilList
            @clicked-commenting="isCommenting = true"
            :has-edit="false"
            :has-delete="false"
            :word="spelling.explicitSpelling"
            :mark-word="true"
          >
            <span
              v-html="correctedHtmlSpelling(spelling.explicitSpelling)"
            ></span>
          </UtilList>

          <CommentWordDisplay
            v-model="isCommenting"
            :route="`/dictionaryWord/${word.uuid}`"
            :uuid="spelling.uuid"
            :word="spelling.explicitSpelling"
            @submit="isCommenting = false"
            @input="isCommenting = false"
          >
            <span
              v-html="correctedHtmlSpelling(spelling.explicitSpelling)"
            ></span>
          </CommentWordDisplay>
        </div>
      </div>
    </template>
  </DictionaryDisplay>
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

  setup() {
    const isCommenting = ref(false);
    const correctedHtmlSpelling = (spelling: string) => {
      let rawHtml = spellingHtmlReading(spelling);
      const firstLetterIndex = rawHtml.indexOf('<em>') + 4;
      return rawHtml.replace(
        rawHtml.charAt(firstLetterIndex),
        rawHtml.charAt(firstLetterIndex).toUpperCase()
      );
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
      isCommenting,
      searchFilter,
      correctedHtmlSpelling,
    };
  },
});
</script>

<style scoped>
.spelling-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}
.spelling-container-space {
  margin-right: 3px;
}
</style>
