<template>
  <span>
    <DictionaryDisplay
      :wordList="wordList"
      :letter="letter"
      :route="route"
      :searchFilter="searchFilter"
      @clicked-util-list="openUtilList"
    >
      <template #translation="{ word }" v-if="route === 'names'">
        <div>
          {{
            word.translations[0]
              ? word.translations[0].translation
              : '(no trans.)'
          }}
        </div>
      </template>

      <template #forms="{ word }">
        <div
          v-for="(formInfo, idx) in word.forms"
          :key="idx"
          class="d-flex flex-wrap pl-4"
        >
          <em
            @click="
              openUtilList({
                comment: true,
                edit: false,
                delete: false,
                word: formInfo.form,
                uuid: formInfo.uuid,
                route: `/dictionaryWord/${word.uuid}`,
                type: 'FORM',
              })
            "
            class="font-weight-bold mr-1"
            style="cursor: pointer"
          >
            {{ formInfo.form }}
          </em>

          <div class="mr-1">({{ formInfo.cases.join('/') }})</div>
          <div
            v-for="(spelling, idx) in formInfo.spellings"
            :key="idx"
            class="d-flex"
          >
            <span v-if="idx > 0" class="mr-1">, </span>
            <span
              style="cursor: pointer"
              @click="
                openUtilList({
                  comment: true,
                  edit: true,
                  delete: true,
                  word: spelling.spelling,
                  uuid: spelling.uuid,
                  route: `/dictionaryWord/${word.uuid}`,
                  type: 'SPELLING',
                })
              "
              v-html="correctedHtmlSpelling(spelling.spelling)"
            ></span>
          </div>
        </div>
      </template>
    </DictionaryDisplay>
    <UtilList
      v-model="utilListOpen"
      @clicked-commenting="beginCommenting"
      :has-edit="false"
      :has-delete="false"
    ></UtilList>
    <CommentWordDisplay
      v-if="isCommenting"
      :route="utilList.route"
      :uuid="utilList.uuid"
      :word="utilList.word"
      @submit="isCommenting = false"
      @input="isCommenting = false"
      ><em class="font-weight-bold mr-1">{{
        utilList.word.charAt(0).toUpperCase() + utilList.word.slice(1)
      }}</em></CommentWordDisplay
    >
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { UtilListDisplay, Word } from '@oare/types';
import DictionaryDisplay from '../DictionaryDisplay/index.vue';
import CommentWordDisplay from '@/components/CommentWordDisplay/index.vue';
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
      type: Array as PropType<Word[]>,
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
    const utilListOpen = ref(false);
    const utilList = ref<UtilListDisplay>({
      comment: false,
      edit: false,
      delete: false,
      word: '',
      uuid: '',
      route: '',
      type: 'NONE',
    });
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

    const beginCommenting = () => {
      utilListOpen.value = false;
      isCommenting.value = true;
    };

    const openUtilList = (inputUtilList: UtilListDisplay) => {
      utilListOpen.value = true;
      utilList.value = inputUtilList;
    };

    const searchFilter = (search: string, word: Word) => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        word.word.toLowerCase().includes(lowerSearch) ||
        (word.translations &&
          word.translations[0].translation
            .toLowerCase()
            .includes(lowerSearch)) ||
        word.forms.some(form => {
          return (
            form.form &&
            (form.form.toLowerCase().includes(lowerSearch) ||
              form.spellings.some(spelling => {
                return (
                  spelling &&
                  spelling.spelling.toLowerCase().includes(lowerSearch)
                );
              }))
          );
        })
      );
    };

    return {
      utilList,
      beginCommenting,
      utilListOpen,
      openUtilList,
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
