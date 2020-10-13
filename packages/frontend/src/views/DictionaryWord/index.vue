<template>
  <OareContentView :title="title" :loading="loading">
    <template #title:pre v-if="!isEditing && wordInfo && wordInfo.canEdit">
      <v-btn icon class="mt-n2 mr-1" :to="`/dictionaryWord/${uuid}/edit`">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <EditWord
      v-if="isEditing && wordInfo"
      :wordInfo.sync="wordInfo"
      :uuid="uuid"
    />
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
  setup(props, context) {
    const loading = ref(true);
    const wordInfo: Ref<WordWithForms | null> = ref(null);

    watch(
      () => props.uuid,
      async () => {
        loading.value = true;
        wordInfo.value = await serverProxy.getDictionaryInfo(props.uuid);
        loading.value = false;
      }
    );

    const breadcrumbItems = computed(() => {
      const items = [
        {
          link: '/words/A',
          text: 'Dictionary Words',
        },
      ];

      if (wordInfo.value) {
        for (const [letterGroup, letters] of Object.entries(
          AkkadianLetterGroupsUpper
        )) {
          if (letters.includes(wordInfo.value.word[0].toUpperCase())) {
            items.push({
              link: `/words/${encodeURIComponent(letterGroup)}`,
              text: letterGroup,
            });
            break;
          }
        }
        items.push({
          link: `/dictionaryWord/${props.uuid}`,
          text: wordInfo.value.word,
        });
      }

      return items;
    });

    const title = computed(() => {
      if (context.root.$route.name === 'dictionaryWord') {
        return wordInfo.value ? wordInfo.value.word : '';
      } else {
        return 'Edit Word';
      }
    });

    const isEditing = computed(() => {
      return context.root.$route.name === 'editDictionaryWord';
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
