<template>
  <OareContentView :title="textInfo.textName" :loading="loading">
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <template #title:pre v-if="textInfo.color && textInfo.colorMeaning">
      <Stoplight
        :color="textInfo.color"
        :colorMeaning="textInfo.colorMeaning"
      />
    </template>
    <template #title:post v-if="textInfo.canWrite">
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
      <v-col
        cols="12"
        sm="5"
        md="7"
        v-if="textInfo.cdliNum && isAdmin"
        class="relative"
      >
        <EpigraphyImage
          :cdli="textInfo.cdliNum"
          @image-loaded="hasPicture = true"
          @image-error="textInfo.cdliNum = null"
        />
      </v-col>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import { createTabletRenderer } from '@oare/oare';
import { TextDraft } from '@oare/types';
import {
  defineComponent,
  reactive,
  ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { EpigraphyResponse } from '@/serverProxy/epigraphies';

import EpigraphyEditor from './EpigraphyEditor.vue';
import { getLetterGroup } from '../CollectionsView/utils';
import Stoplight from './Stoplight.vue';
import EpigraphyImage from './EpigraphyImage.vue';
import EpigraphyFullDisplay from './EpigraphyFullDisplay.vue';

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

    const loading = ref(false);
    const draft = ref<DraftContent | null>(null);
    const hasPicture = ref(false);
    const textInfo = ref<EpigraphyResponse>({
      canWrite: false,
      textName: '',
      collection: {
        uuid: '',
        name: '',
      },
      cdliNum: '',
      units: [],
      color: '',
      colorMeaning: '',
      markups: [],
      discourseUnits: [],
    });

    const updateDraft = (newDraft: DraftContent) => (draft.value = newDraft);

    const breadcrumbItems = computed(() => {
      const letterGroup = getLetterGroup(textInfo.value.collection.name);

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
          link: `/collections/name/${textInfo.value.collection.uuid}`,
          text: textInfo.value.collection.name,
        },
      ];
    });

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
        epigraphicUnits: textInfo.value.units,
        markupUnits: textInfo.value.markups,
        discourseUnits: textInfo.value.discourseUnits,
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
        textInfo.value.units,
        textInfo.value.markups,
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

    const isAdmin = computed(() => store.getters.isAdmin);

    onMounted(async () => {
      try {
        loading.value = true;
        textInfo.value = await server.getEpigraphicInfo(textUuid);
        draft.value = textInfo.value.draft || null;
      } catch (err) {
        if (err.response) {
          if (err.response.status === 403) {
            router.replace({ name: '403' });
          }
        } else {
          actions.showErrorSnackbar('Error loading text. Please try again.');
        }
      } finally {
        loading.value = false;
      }
    });

    return {
      textInfo,
      isEditing,
      draftContent,
      breadcrumbItems,
      isAdmin,
      hasPicture,
      routeProps,
      routeActions,
      loading,
    };
  },
});
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
