<template>
  <OareContentView :title="title" :loading="loading">
    <template #title:pre v-if="wordInfo && canEdit">
      <v-btn
        v-if="!isEditing"
        icon
        class="mt-n2 mr-1"
        @click="isEditing = true"
      >
        <v-icon class="test-pencil">mdi-pencil</v-icon>
      </v-btn>

      <word-name-edit
        v-else
        :word.sync="wordInfo.word"
        :wordUuid="uuid"
        @close-edit="isEditing = false"
      />
    </template>
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <WordInfo v-if="wordInfo" :wordInfo="wordInfo" />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  computed,
  PropType,
  onMounted,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { WordWithForms, DictionaryForm, PermissionResponse } from '@oare/types';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import WordInfo from './WordInfo.vue';
import EditWord from './EditWord.vue';
import WordNameEdit from './WordNameEdit.vue';
import router from '@/router';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'DictionaryWord',
  components: {
    WordInfo,
    EditWord,
    WordNameEdit,
  },
  props: {
    uuid: {
      type: String,
      required: true,
    },
  },
  setup(props, context) {
    const store = sl.get('store');
    const serverProxy = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(true);
    const isEditing = ref(false);
    const wordInfo: Ref<WordWithForms | null> = ref(null);

    const canEdit = computed(() => {
      const permissions = store.getters.permissions;
      return permissions.dictionary.length > 0;
    });

    onMounted(async () => {
      loading.value = true;
      try {
        wordInfo.value = await serverProxy.getDictionaryInfo(props.uuid);
      } catch {
        actions.showErrorSnackbar('Failed to retrieve dictionary info');
      } finally {
        loading.value = false;
      }
    });

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
      if (wordInfo.value && !isEditing.value) {
        return wordInfo.value.word;
      }
      return '';
    });

    return {
      loading,
      wordInfo,
      breadcrumbItems,
      title,
      isEditing,
      canEdit,
    };
  },
});
</script>
