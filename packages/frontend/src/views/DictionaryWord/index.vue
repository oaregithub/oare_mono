<template>
  <OareContentView :loading="loading">
    <template #title>
      <v-row v-if="!isEditing" class="px-3">
        <v-btn
          v-if="canUpdateWordSpelling && !isEditing"
          icon
          class="mt-n2 mr-1"
          @click="isEditing = true"
        >
          <v-icon class="test-pencil">mdi-pencil</v-icon>
        </v-btn>
        <span class="font-weight-bold">{{ title }}</span>
      </v-row>

      <word-name-edit
        v-else-if="wordInfo"
        :word.sync="wordInfo.word"
        :wordUuid="uuid"
        @close-edit="isEditing = false"
      />
    </template>
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <WordInfo
      v-if="wordInfo"
      :wordInfo="wordInfo"
      :wordUuid="uuid"
      :updateWordInfo="updateWordInfo"
    />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  computed,
  PropType,
  watch,
  provide,
  InjectionKey,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import {
  DictionaryForm,
  PermissionResponse,
  DictionaryWordResponse,
} from '@oare/types';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import WordInfo from './WordInfo.vue';
import WordNameEdit from './WordNameEdit.vue';
import router from '@/router';
import sl from '@/serviceLocator';

export const ReloadKey: InjectionKey<() => Promise<void>> = Symbol();

export default defineComponent({
  name: 'DictionaryWord',
  components: {
    WordInfo,
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
    const wordInfo = ref<DictionaryWordResponse | null>(null);

    const canUpdateWordSpelling = computed(() =>
      store.getters.permissions.dictionary.includes('UPDATE_WORD_SPELLING')
    );

    const updateWordInfo = (newWordInfo: DictionaryWordResponse) => {
      wordInfo.value = newWordInfo;
    };

    const loadDictionaryInfo = async () => {
      loading.value = true;
      try {
        wordInfo.value = await serverProxy.getDictionaryInfo(props.uuid);
      } catch {
        actions.showErrorSnackbar('Failed to retrieve dictionary info');
      } finally {
        loading.value = false;
      }
    };

    provide(ReloadKey, loadDictionaryInfo);

    watch(props, loadDictionaryInfo, { immediate: true });

    const breadcrumbItems = computed(() => {
      const items: BreadcrumbItem[] = [
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
          link: null,
          text: wordInfo.value.word,
        });
      }

      return items;
    });

    const title = computed(() => {
      if (wordInfo.value) {
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
      canUpdateWordSpelling,
      updateWordInfo,
    };
  },
});
</script>
