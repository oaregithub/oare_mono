<template>
  <OareContentView :title="title" :loading="loading">
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <EditWord v-if="isEditing && wordInfo" :wordInfo="wordInfo" />
    <WordInfo v-else-if="!isEditing && wordInfo" :wordInfo="wordInfo" />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  watch,
  computed,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { WordWithForms, DictionaryForm } from '@/types/dictionary';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import WordInfo from './WordInfo.vue';
import EditWord from './EditWord.vue';
import serverProxy from '@/serverProxy';
import router from '@/router';

export default defineComponent({
  name: 'DictionaryWord',
  components: {
    WordInfo,
    EditWord,
  },
  props: {
    uuid: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(true);
    const wordInfo: Ref<WordWithForms | null> = ref(null);
    const breadcrumbItems: Ref<BreadcrumbItem[]> = ref([
      {
        link: '/words/A',
        text: 'Dictionary Words',
      },
    ]);

    watch(
      () => props.uuid,
      async () => {
        loading.value = true;
        wordInfo.value = await serverProxy.getDictionaryInfo(props.uuid);
        for (const [letterGroup, letters] of Object.entries(
          AkkadianLetterGroupsUpper
        )) {
          if (letters.includes(wordInfo.value.word[0].toUpperCase())) {
            breadcrumbItems.value.push({
              link: `/words/${encodeURIComponent(letterGroup)}`,
              text: letterGroup,
            });
            break;
          }
        }
        breadcrumbItems.value.push({
          link: null,
          text: wordInfo.value.word,
        });
        loading.value = false;
      }
    );

    const title = computed(() => {
      if (router.currentRoute.name === 'dictionaryWord') {
        return wordInfo.value ? wordInfo.value.word : '';
      } else {
        return 'Edit Word';
      }
    });

    const isEditing = computed(() => {
      return router.currentRoute.name === 'editDictionaryWord';
    });

    return {
      loading,
      wordInfo,
      breadcrumbItems,
      title,
      isEditing,
    };
  },
});
</script>
