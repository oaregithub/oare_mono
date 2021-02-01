<template>
  <OareContentView :title="textName" :loading="loading">
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <template #title:pre>
      <Stoplight :color="color" :colorMeaning="colorMeaning" />
    </template>
    <template #title:post v-if="canWrite">
      <v-btn
        v-if="!isEditing"
        color="primary"
        :to="`/epigraphies/${textUuid}/edit`"
        >Edit</v-btn
      >
    </template>
    <v-row>
      <v-col cols="12" :sm="hasPicture ? 7 : 12" :md="hasPicture ? 5 : 12">
        <router-view v-bind="routeProps" v-on="routeActions"></router-view>
      </v-col>
      <v-col cols="12" sm="5" md="7" v-if="cdli && isAdmin" class="relative">
        <EpigraphyImage
          :cdli="cdli"
          @image-loaded="hasPicture = true"
          @image-error="cdli = null"
        />
      </v-col>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import {
  createTabletRenderer,
  DiscourseUnit,
  EpigraphicUnit,
  MarkupUnit,
} from '@oare/oare';
import { TextDraft } from '@oare/types';
import {
  defineComponent,
  reactive,
  toRefs,
  ref,
  Ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';

import EpigraphyEditor from './EpigraphyEditor.vue';
import { getLetterGroup } from '../CollectionsView/utils';
import Stoplight from './Stoplight.vue';
import EpigraphyImage from './EpigraphyImage.vue';
import EpigraphyFullDisplay from './EpigraphyFullDisplay.vue';

interface EpigraphyState {
  loading: boolean;
  collection: string;
  canWrite: boolean;
  textName: string;
}

export type DraftContent = Pick<TextDraft, 'content' | 'notes'>;

export default defineComponent({
  name: 'EpigraphyView',
  components: {
    EpigraphyEditor,
    Stoplight,
    EpigraphyImage,
    EpigraphyFullDisplay,
  },
  props: {
    textUuid: {
      type: String,
      required: true,
    },
  },

  setup({ textUuid }) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = reactive(sl.get('router'));

    const epigraphicUnits = ref<EpigraphicUnit[]>([]);
    const markupUnits = ref<MarkupUnit[]>([]);

    const epigraphyState = reactive<EpigraphyState>({
      loading: false,
      collection: '',
      canWrite: false,
      textName: '',
    });

    const collection: Ref<{ uuid: string; name: string }> = ref({
      uuid: '',
      name: '',
    });
    const hasPicture = ref(false);
    const breadcrumbItems = computed(() => {
      const letterGroup = getLetterGroup(collection.value.name);

      return [
        {
          link: '/collections/A-J',
          text: 'Texts',
        },
        {
          link: `/collections/${letterGroup}`,
          text: letterGroup,
        },
        {
          link: `/collections/name/${collection.value.uuid}`,
          text: collection.value.name,
        },
      ];
    });
    const discourseUnits: Ref<DiscourseUnit[]> = ref([]);
    const draft = ref<DraftContent | null>(null);
    const cdli: Ref<string | null> = ref(null);
    const color = ref('');
    const colorMeaning = ref('');

    const updateDraft = (newDraft: DraftContent) => (draft.value = newDraft);

    const isEditing = computed(
      () => router.currentRoute.name === 'epigraphyEditor'
    );

    const routeProps = computed(() => {
      if (router.currentRoute.name === 'epigraphyEditor') {
        return {
          draft: draftContent.value,
        };
      }

      return {
        epigraphicUnits: epigraphicUnits.value,
        markupUnits: markupUnits.value,
        discourseUnits: discourseUnits.value,
      };
    });

    const routeActions = computed(() => {
      if (router.currentRoute.name === 'epigraphyEditor') {
        return {
          'save-draft': updateDraft,
        };
      }

      return {};
    });

    const draftContent = computed<DraftContent>(() => {
      if (draft.value) {
        return draft.value;
      }

      const draftRenderer = createTabletRenderer(
        epigraphicUnits.value,
        markupUnits.value,
        { lineNumbers: true }
      );
      return {
        content: draftRenderer.sides.map(side => ({
          side,
          text: draftRenderer.sideReading(side),
        })),
        notes: '',
      };
    });

    onMounted(async () => {
      try {
        epigraphyState.loading = true;
        const {
          collection: collectionInfo,
          units,
          canWrite,
          textName,
          cdliNum,
          color: epColor,
          colorMeaning: epColorMeaning,
          markups,
          discourseUnits: textDiscourseUnits,
          draft: textDraft,
        } = await server.getEpigraphicInfo(textUuid);
        color.value = epColor;
        colorMeaning.value = epColorMeaning;
        discourseUnits.value = textDiscourseUnits;
        cdli.value = cdliNum;
        epigraphicUnits.value = units;
        markupUnits.value = markups;
        draft.value = textDraft || null;

        if (collectionInfo) {
          collection.value = collectionInfo;
        }

        epigraphyState.canWrite = canWrite;
        epigraphyState.textName = textName;
      } catch (err) {
        if (err.response) {
          if (err.response.status === 403) {
            router.replace({ name: '403' });
          }
        } else {
          actions.showErrorSnackbar('Error loading text. Please try again.');
        }
      } finally {
        epigraphyState.loading = false;
      }
    });

    const isAdmin = computed(() => store.getters.isAdmin);

    return {
      ...toRefs(epigraphyState),
      isEditing,
      draftContent,
      discourseUnits,
      breadcrumbItems,
      isAdmin,
      cdli,
      color,
      colorMeaning,
      hasPicture,
      epigraphicUnits,
      markupUnits,
      routeProps,
      routeActions,
    };
  },
});
</script>

<style scoped lang="scss">
.sideName {
  min-width: 50px;
}

.relative {
  position: relative;
}
</style>
