<template>
  <v-row>
    <v-col
      cols="12"
      :sm="canViewEpigraphyImages ? 7 : 12"
      :md="canViewEpigraphyImages ? 5 : 12"
    >
      <OareContentView :title="textInfo.text.name" :loading="loading">
        <template #header v-if="!disableEditing">
          <OareBreadcrumbs :items="breadcrumbItems" />
        </template>
        <div class="textInfo">
          <div
            v-if="
              textInfo.text.excavationPrefix || textInfo.text.excavationNumber
            "
          >
            Excavation Info: {{ textInfo.text.excavationPrefix }}
            {{ textInfo.text.excavationNumber }}
          </div>
          <div v-if="textInfo.text.museumPrefix || textInfo.text.museumNumber">
            Museum Info: {{ textInfo.text.museumPrefix }}
            {{ textInfo.text.museumNumber }}
          </div>
          <div
            v-if="
              textInfo.text.publicationPrefix || textInfo.text.publicationNumber
            "
          >
            Primary Publication Info: {{ textInfo.text.publicationPrefix }}
            {{ textInfo.text.publicationNumber }}
          </div>
          <br />
        </div>
        <template
          #title:pre
          v-if="textInfo.color && textInfo.colorMeaning && !disableEditing"
        >
          <Stoplight
            :transliteration="transliteration"
            :showEditDialog="true"
            :textUuid="textUuid"
            :key="textInfo.color"
            class="mr-2"
          />
        </template>
        <template #title:post v-if="textInfo.canWrite && !disableEditing">
          <v-btn
            v-if="!isEditing"
            color="primary"
            :to="`/epigraphies/${textUuid}/edit`"
            class="mx-4"
            >Edit</v-btn
          >
        </template>
        <epigraphy-full-display
          v-if="disableEditing"
          v-bind="routeProps"
          :localDiscourseInfo="localDiscourseInfo"
        />
        <router-view
          v-else
          v-bind="routeProps"
          v-on="routeActions"
        ></router-view>
        <span v-if="!textInfo.hasEpigraphy">
          Apologies, we do not have a transliteration for this text at the
          moment.
        </span>
      </OareContentView>
    </v-col>
    <v-col
      cols="12"
      sm="5"
      md="7"
      v-if="canViewEpigraphyImages"
      class="relative test-cdli-image"
    >
      <EpigraphyImage :imageLinks="imageUrls" :sticky="!disableEditing" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { createTabletRenderer } from '@oare/oare';
import { TextDiscourseRow, TextDraft } from '@oare/types';
import {
  defineComponent,
  reactive,
  ref,
  onMounted,
  computed,
  InjectionKey,
  provide,
  ComputedRef,
  PropType,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { EpigraphyResponse, TranslitOption } from '@oare/types';

import EpigraphyEditor from './Editor/EpigraphyEditor.vue';
import { getLetterGroup } from '../CollectionsView/utils';
import Stoplight from './EpigraphyDisplay/components/Stoplight.vue';
import EpigraphyImage from './EpigraphyDisplay/components/EpigraphyImage.vue';
import EpigraphyFullDisplay from './EpigraphyDisplay/EpigraphyFullDisplay.vue';

export interface DraftContent extends Pick<TextDraft, 'content' | 'notes'> {
  uuid: string | null;
}

export const EpigraphyReloadKey: InjectionKey<() => Promise<void>> = Symbol();

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
      required: false,
    },
    discourseToHighlight: {
      type: String,
      required: false,
    },
    disableEditing: {
      type: Boolean,
      default: false,
    },
    localEpigraphyUnits: {
      type: Object as PropType<EpigraphyResponse>,
      required: false,
    },
    localImageUrls: {
      type: Array as PropType<string[]>,
      required: false,
    },
    localDiscourseInfo: {
      type: Array as PropType<TextDiscourseRow[]>,
      required: false,
    },
  },

  setup({
    textUuid,
    discourseToHighlight,
    localEpigraphyUnits,
    localImageUrls,
  }) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = reactive(sl.get('router'));

    const loading = ref(false);
    const draft = ref<DraftContent | null>(null);
    const hasPicture = computed(() => imageUrls.value.length > 0);
    const textInfo = ref<EpigraphyResponse>({
      canWrite: false,
      text: {
        uuid: '',
        type: '',
        name: '',
        excavationPrefix: '',
        excavationNumber: '',
        museumPrefix: '',
        museumNumber: '',
        publicationPrefix: '',
        publicationNumber: '',
      },
      collection: {
        uuid: '',
        name: '',
      },
      cdliNum: '',
      units: [],
      color: '',
      colorMeaning: '',
      discourseUnits: [],
      hasEpigraphy: false,
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
        hasPicture.value &&
        store.getters.permissions
          .map(permission => permission.name)
          .includes('VIEW_EPIGRAPHY_IMAGES')
    );

    const getTextInfo = async () => {
      if (localEpigraphyUnits) {
        textInfo.value = localEpigraphyUnits;
      } else if (textUuid) {
        textInfo.value = await server.getEpigraphicInfo(textUuid);
      }
    };

    onMounted(async () => {
      try {
        loading.value = true;
        await getTextInfo();
        draft.value = textInfo.value.draft || null;
        if (localImageUrls) {
          imageUrls.value = localImageUrls;
        } else if (textUuid) {
          imageUrls.value = await server.getImageLinks(
            textUuid,
            textInfo.value.cdliNum
          );
        }
      } catch (err) {
        if ((err as any).response) {
          if ((err as any).response.status === 403) {
            router.replace({ name: '403' });
          }
        } else {
          actions.showErrorSnackbar(
            'Error loading text. Please try again.',
            err as Error
          );
        }
      } finally {
        loading.value = false;
      }
    });

    const transliteration: ComputedRef<TranslitOption> = computed(() => ({
      color: textInfo.value.color,
      colorMeaning: textInfo.value.colorMeaning,
    }));

    provide(EpigraphyReloadKey, getTextInfo);

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
      getTextInfo,
      transliteration,
    };
  },
});
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
