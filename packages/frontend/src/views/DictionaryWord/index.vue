<template>
  <OareContentView :loading="loading">
    <template #title>
      <v-row v-if="!isEditing" class="px-3">
        <v-tooltip bottom open-delay="800">
          <template #activator="{ on, attrs }">
            <v-btn
              v-if="canUpdateWordSpelling && !isEditing && allowEditing"
              icon
              class="mr-1"
              @click="isEditing = true"
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon class="test-pencil" size="20">mdi-pencil</v-icon>
            </v-btn>
          </template>
          <span>Edit Word</span>
        </v-tooltip>
        <UtilList
          @comment-clicked="openComment(uuid, wordInfo ? wordInfo.word : '')"
          :hasEdit="false"
          :hasDelete="false"
          :hideMenu="!allowCommenting && !allowEditing"
        >
          <template #activator="{ on, attrs }">
            <strong
              class="test-word-util-list"
              :class="{
                'cursor-display':
                  (allowCommenting || allowEditing) && canComment,
              }"
              v-on="on"
              v-bind="attrs"
            >
              <mark
                v-if="uuid === uuidToHighlight"
                :class="allowEditing && canUpdateWordSpelling ? 'ml-1' : ''"
                >{{ title }}</mark
              >
              <span
                v-else
                :class="allowEditing && canUpdateWordSpelling ? 'ml-1' : ''"
                >{{ title }}</span
              >
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
      :item="commentDialogWord"
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
import WordInfo from './components/WordInfo/WordInfo.vue';
import WordNameEdit from './components/WordNameEdit.vue';
import sl from '@/serviceLocator';
import UtilList from '@/components/UtilList/index.vue';
import CommentItemDisplay from '@/components/CommentItemDisplay/index.vue';
import EventBus, { ACTIONS } from '@/EventBus';

export const ReloadKey: InjectionKey<() => Promise<void>> = Symbol();

export default defineComponent({
  name: 'DictionaryWord',
  components: {
    WordInfo,
    WordNameEdit,
    UtilList,
    CommentItemDisplay,
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
      store.hasPermission('UPDATE_WORD_SPELLING')
    );

    const canComment = computed(() => store.hasPermission('ADD_COMMENTS'));

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
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve dictionary info',
          err as Error
        );
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
        ? () => import('@/components/CommentItemDisplay/index.vue')
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
      canComment,
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
