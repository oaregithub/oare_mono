<template>
  <OareContentView :loading="loading">
    <template #title>
      <v-row v-if="!isEditing" class="px-3">
        <v-btn
          v-if="canUpdateWordSpelling && !isEditing && allowEditing"
          icon
          class="mt-n2 mr-1"
          @click="isEditing = true"
        >
          <v-icon class="test-pencil">mdi-pencil</v-icon>
        </v-btn>
        <UtilList
          @comment-clicked="openComment(uuid, wordInfo ? wordInfo.word : '')"
          :hasEdit="false"
          :hasDelete="false"
          :hideMenu="!allowCommenting && !allowEditing"
        >
          <template #activator="{ on, attrs }">
            <strong
              class="test-word-util-list"
              :class="{ 'cursor-display': allowCommenting || allowEditing }"
              v-on="on"
              v-bind="attrs"
            >
              <mark v-if="uuid === uuidToHighlight">{{ title }}</mark>
              <span v-else>{{ title }}</span>
            </strong>
          </template>
        </UtilList>
      </v-row>

      <word-name-edit
        v-else-if="wordInfo && allowEditing"
        :word.sync="wordInfo.word"
        :wordUuid="uuid"
        @close-edit="isEditing = false"
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
      :allow-editing="allowEditing"
    />
    <component
      v-if="allowCommenting"
      :is="commentComponent"
      v-model="isCommenting"
      :word="commentDialogWord"
      :uuid="commentDialogUuid"
      :key="commentDialogUuid"
      :route="`/${routeName}/${uuid}`"
      >{{ commentDialogWord }}</component
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
  onMounted,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { Word } from '@oare/types';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import WordInfo from './WordInfo.vue';
import WordNameEdit from './WordNameEdit.vue';
import sl from '@/serviceLocator';
import EditWordDialog from './Forms/components/EditWordDialog.vue';
import UtilList from '@/components/UtilList/index.vue';
import CommentWordDisplay from '@/components/CommentWordDisplay/index.vue';
import EventBus, { ACTIONS } from '@/EventBus';

export const ReloadKey: InjectionKey<() => Promise<void>> = Symbol();

export default defineComponent({
  name: 'DictionaryWord',
  components: {
    WordInfo,
    WordNameEdit,
    EditWordDialog,
    UtilList,
    CommentWordDisplay,
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
    const router = sl.get('router');

    const commentDialogUuid = ref('');
    const commentDialogWord = ref('');
    const routeName = router.currentRoute.name;
    const loading = ref(true);
    const isCommenting = ref(false);
    const isEditing = ref(false);
    const wordInfo = ref<Word | null>(null);

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

    // To avoid circular dependencies
    const commentComponent = computed(() =>
      props.allowCommenting
        ? () => import('@/components/CommentWordDisplay/index.vue')
        : null
    );

    const openComment = (uuid: string, word: string) => {
      commentDialogUuid.value = uuid;
      commentDialogWord.value = word;
      isCommenting.value = true;
    };

    onMounted(() => {
      EventBus.$on(
        ACTIONS.COMMENT_DIALOG,
        (options: { uuid: string; word: string }) => {
          commentDialogUuid.value = options.uuid;
          commentDialogWord.value = options.word;
          isCommenting.value = true;
        }
      );
    });

    return {
      commentComponent,
      loading,
      wordInfo,
      breadcrumbItems,
      title,
      isCommenting,
      isEditing,
      canUpdateWordSpelling,
      updateWordInfo,
      routeName,
      commentDialogUuid,
      commentDialogWord,
      openComment,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
