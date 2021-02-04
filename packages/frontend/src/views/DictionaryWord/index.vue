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

        <span
          @click="
            openUtilList({
              comment: true,
              edit: false,
              delete: false,
              word: wordInfo.word,
              uuid: wordInfo.uuid,
              route: `/dictionaryWord/${wordInfo.word}`,
              type: 'WORD',
            })
          "
          class="font-weight-bold test-word-util-list"
          style="cursor: pointer"
        >
          {{ title }}
        </span>
      </v-row>

      <word-name-edit
        v-else-if="wordInfo && utilList.type === 'WORD'"
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

    <template v-if="isEditing && utilList.type === 'SPELLING'">
      <spelling-dialog
        :form="utilList.form"
        :spelling="utilList.formSpelling"
        v-model="isEditing"
      />
    </template>

    <OareDialog
      v-if="isDeleting && utilList.type === 'SPELLING'"
      v-model="isDeleting"
      title="Delete spelling"
      submitText="Yes, delete"
      cancelText="No, don't delete"
      :persistent="false"
      @submit="deleteSpelling"
      :submitLoading="deleteSpellingLoading"
    >
      Are you sure you want to delete the spelling {{ utilList.word }} from this
      form? This action cannot be undone.
    </OareDialog>

    <UtilList
      v-if="utilListOpen"
      v-model="utilListOpen"
      class="test-util-list-displayed"
      @clicked-commenting="beginCommenting"
      @clicked-editing="beginEditing"
      @clicked-deleting="beginDeleting"
      :has-comment="utilList.comment"
      :has-edit="utilList.edit"
      :has-delete="utilList.delete"
    ></UtilList>
    <CommentWordDisplay
      v-if="isCommenting"
      :route="utilList.route"
      :uuid="utilList.uuid"
      :word="utilList.word"
      @submit="isCommenting = false"
      @input="isCommenting = false"
      >{{ utilList.word }}</CommentWordDisplay
    >
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
  inject,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import {
  DictionaryForm,
  DictionaryWordResponse,
  UtilListDisplay,
  UtilListType,
} from '@oare/types';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import WordInfo from './WordInfo.vue';
import WordNameEdit from './WordNameEdit.vue';
import router from '@/router';
import sl from '@/serviceLocator';
import UtilList from '../../components/UtilList/index.vue';
import CommentWordDisplay from '../../components/CommentWordDisplay/index.vue';
import SpellingDialog from './SpellingDialog.vue';

export const SendUtilList: InjectionKey<(
  utilDisplay: UtilListDisplay
) => Promise<void>> = Symbol();
export const ReloadKey: InjectionKey<() => Promise<void>> = Symbol();

export default defineComponent({
  name: 'DictionaryWord',
  components: {
    WordInfo,
    WordNameEdit,
    UtilList,
    CommentWordDisplay,
    SpellingDialog,
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
    const isCommenting = ref(false);
    const isEditing = ref(false);
    const isDeleting = ref(false);
    const wordInfo = ref<DictionaryWordResponse | null>(null);
    const deleteSpellingLoading = ref(false);

    const canUpdateWordSpelling = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('UPDATE_WORD_SPELLING')
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

    const beginCommenting = () => {
      utilListOpen.value = false;
      isCommenting.value = true;
    };

    const beginEditing = () => {
      utilListOpen.value = false;
      isEditing.value = true;
    };

    const beginDeleting = () => {
      utilListOpen.value = false;
      isDeleting.value = true;
    };

    const openUtilList = (injectedUtilList: UtilListDisplay) => {
      utilListOpen.value = true;
      utilList.value = injectedUtilList;
    };

    provide(SendUtilList, openUtilList);
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

    const deleteSpelling = async () => {
      try {
        deleteSpellingLoading.value = true;
        await serverProxy.removeSpelling(utilList.value.uuid);
        actions.showSnackbar('Successfully removed spelling');
        await loadDictionaryInfo();
      } catch {
        actions.showErrorSnackbar('Failed to delete spelling');
      } finally {
        deleteSpellingLoading.value = false;
        isDeleting.value = false;
      }
    };

    return {
      isDeleting,
      utilList,
      beginDeleting,
      beginEditing,
      deleteSpelling,
      deleteSpellingLoading,
      openUtilList,
      beginCommenting,
      utilListOpen,
      isCommenting,
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
