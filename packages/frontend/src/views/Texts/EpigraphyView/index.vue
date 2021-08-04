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
      <v-col
        cols="12"
        :sm="canViewEpigraphyImages ? 7 : 12"
        :md="canViewEpigraphyImages ? 5 : 12"
      >
        <router-view v-bind="routeProps" v-on="routeActions"></router-view>
      </v-col>
      <v-col
        cols="12"
        sm="5"
        md="7"
        v-if="canViewEpigraphyImages"
        class="relative test-cdli-image"
      >
        <EpigraphyImage :imageLinks="imageUrls" />
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
import { EpigraphyResponse } from '@oare/types';

import EpigraphyEditor from './Editor/EpigraphyEditor.vue';
import { getLetterGroup } from '../CollectionsView/utils';
import Stoplight from './EpigraphyDisplay/components/Stoplight.vue';
import EpigraphyImage from './EpigraphyDisplay/components/EpigraphyImage.vue';
import EpigraphyFullDisplay from './EpigraphyDisplay/EpigraphyFullDisplay.vue';

export interface DraftContent extends Pick<TextDraft, 'content' | 'notes'> {
  uuid: string | null;
}

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
    discourseToHighlight: {
      type: String,
      required: false,
    },
  },

  setup({ textUuid, discourseToHighlight }) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = reactive(sl.get('router'));

    const loading = ref(false);
    const draft = ref<DraftContent | null>(null);
    const hasPicture = computed(() => imageUrls.value.length > 0);
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
      discourseUnits: [],
    });
    const imageUrls = ref<string[]>([]);

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
        discourseUnits: textInfo.value.discourseUnits,
        discourseToHighlight,
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

      const draftRenderer = createTabletRenderer(textInfo.value.units, {
        lineNumbers: true,
      });
      return {
        uuid: null,
        content: draftRenderer.sides.map(side => ({
          side,
          text: draftRenderer.sideReading(side),
        })),
        notes: '',
      };
    });

    const isAdmin = computed(() => store.getters.isAdmin);

    const canViewEpigraphyImages = computed(
      () =>
        hasPicture &&
        store.getters.permissions
          .map(permission => permission.name)
          .includes('VIEW_EPIGRAPHY_IMAGES')
    );

    onMounted(async () => {
      try {
        loading.value = true;
        textInfo.value = await server.getEpigraphicInfo(textUuid);
        draft.value = textInfo.value.draft || null;
        imageUrls.value = await server.getImageLinks(
          textUuid,
          textInfo.value.cdliNum
        );
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
      canViewEpigraphyImages,
      imageUrls,
    };
  },
});
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
