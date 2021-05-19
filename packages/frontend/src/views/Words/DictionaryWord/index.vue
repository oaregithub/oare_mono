<template>
  <OareContentView :loading="loading">
    <template #title>
      <v-row v-if="!isEditing" class="px-3">
        <v-btn
          v-if="canUpdateWordSpelling && !isEditing && allowEditing"
          icon
          class="mt-n2 mr-1"
          @click="changeUtilListType(true, 'WORD')"
        >
          <v-icon class="test-pencil">mdi-pencil</v-icon>
        </v-btn>

        <span
          @click="sendWordInfoToUtilList"
          class="font-weight-bold test-word-util-list"
          :class="{ 'cursor-display': allowCommenting }"
        >
          <mark v-if="uuid === uuidToHighlight">{{ title }}</mark>
          <template v-else>{{ title }}</template>
        </span>
      </v-row>

      <word-name-edit
        v-else-if="wordInfo && utilList.type === 'WORD' && allowEditing"
        :word.sync="wordInfo.word"
        :wordUuid="uuid"
        @close-edit="changeUtilListType(false, 'NONE')"
      />
    </template>
    <template #header>
      <OareBreadcrumbs v-if="allowBreadcrumbs" :items="breadcrumbItems" />
    </template>
    <WordInfo
      v-if="wordInfo"
      :wordInfo="wordInfo"
      :wordUuid="uuid"
      :updateWordInfo="updateWordInfo"
      :uuid-to-highlight="uuidToHighlight"
      :cursor="allowCommenting"
      :allow-editing="allowEditing"
    />

    <template v-if="isEditing && utilList.type === 'SPELLING' && allowEditing">
      <edit-word-dialog
        v-model="isEditing"
        :form="utilList.form"
        :spelling="utilList.formSpelling"
      />
    </template>

    <OareDialog
      v-if="isDeleting && utilList.type === 'SPELLING' && allowDeleting"
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
    <component
      :is="commentComponent"
      v-if="isCommenting"
      :route="utilList.route"
      :uuid="utilList.uuid"
      :word="utilList.word"
      @submit="isCommenting = false"
      @input="isCommenting = false"
      >{{ utilList.word }}</component
    >
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  PropType,
  watch,
  provide,
  InjectionKey,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { Word, UtilListDisplay, UtilListType } from '@oare/types';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import WordInfo from './WordInfo.vue';
import WordNameEdit from './WordNameEdit.vue';
import sl from '@/serviceLocator';
import UtilList from '@/components/UtilList/index.vue';
import EditWordDialog from './Forms/components/EditWordDialog.vue';

export const SendUtilList: InjectionKey<
  (utilDisplay: UtilListDisplay) => Promise<void>
> = Symbol();
export const ReloadKey: InjectionKey<() => Promise<void>> = Symbol();

export default defineComponent({
  name: 'DictionaryWord',
  components: {
    WordInfo,
    WordNameEdit,
    UtilList,
    EditWordDialog,
  },
  props: {
    uuid: {
      type: String,
      required: true,
    },
    selectedWordInfo: {
      type: Object as PropType<Word>,
      default: null,
    },
    uuidToHighlight: {
      type: String,
      default: null,
    },
    allowCommenting: {
      type: Boolean,
      default: true,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
    allowDeleting: {
      type: Boolean,
      default: true,
    },
    allowBreadcrumbs: {
      type: Boolean,
      default: true,
    },
    route: {
      type: String as PropType<'words' | 'names' | 'places'>,
      default: 'words',
    },
  },
  setup(props) {
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
    const wordInfo = ref<Word | null>(null);
    const deleteSpellingLoading = ref(false);

    const canUpdateWordSpelling = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('UPDATE_WORD_SPELLING')
    );

    const updateWordInfo = (newWordInfo: Word) => {
      wordInfo.value = newWordInfo;
    };

    const loadDictionaryInfo = async () => {
      loading.value = true;
      try {
        if (props.selectedWordInfo) {
          wordInfo.value = props.selectedWordInfo;
        } else {
          wordInfo.value = await serverProxy.getDictionaryInfo(props.uuid);
        }
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

    const sendWordInfoToUtilList = () => {
      openUtilList({
        comment: true,
        edit: false,
        delete: false,
        word: wordInfo.value ? wordInfo.value.word : '',
        uuid: props.uuid,
        route: `/dictionaryWord/${props.uuid}`,
        type: 'WORD',
      });
    };

    const openUtilList = (injectedUtilList: UtilListDisplay) => {
      if (!props.allowCommenting && injectedUtilList.comment) {
        return;
      }

      utilListOpen.value = true;
      utilList.value = injectedUtilList;
    };

    provide(SendUtilList, openUtilList);
    provide(ReloadKey, loadDictionaryInfo);
    watch(props, loadDictionaryInfo, { immediate: true });

    const breadcrumbItems = computed(() => {
      const items: BreadcrumbItem[] = [
        {
          link: `/${props.route}/A`,
          text: `Dictionary ${props.route[0].toUpperCase()}${props.route.slice(
            1
          )}`,
        },
      ];

      if (wordInfo.value) {
        for (const [letterGroup, letters] of Object.entries(
          AkkadianLetterGroupsUpper
        )) {
          if (letters.includes(wordInfo.value.word[0].toUpperCase())) {
            items.push({
              link: `/${props.route}/${encodeURIComponent(letterGroup)}`,
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

    const changeUtilListType = (
      editing: boolean,
      utilListType: UtilListType
    ) => {
      isEditing.value = editing;
      utilList.value.type = utilListType;
    };

    // To avoid circular dependencies
    const commentComponent = computed(() =>
      props.allowCommenting
        ? () => import('@/components/CommentWordDisplay/index.vue')
        : null
    );

    return {
      commentComponent,
      sendWordInfoToUtilList,
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
      changeUtilListType,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
