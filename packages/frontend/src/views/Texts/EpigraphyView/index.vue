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
        <v-row class="ma-0 mb-6">
          <v-icon
            v-if="!editText && !disableEditing"
            @click="toggleTextInfo"
            class="test-pencil mr-4"
            >mdi-pencil</v-icon
          >
          <div>
            <div
              v-if="
                textInfo.text.excavationPrefix ||
                textInfo.text.excavationNumber ||
                editText
              "
            >
              Excavation Info: {{ textInfo.text.excavationPrefix }}
              {{ textInfo.text.excavationNumber }}
              <v-row v-if="editText">
                <v-col cols="8" sm="4">
                  <v-text-field
                    outlined
                    v-model="textInfo.text.excavationPrefix"
                    label="Prefix"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="8" sm="4">
                  <v-text-field
                    outlined
                    v-model="textInfo.text.excavationNumber"
                    label="Number"
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
            <div
              v-if="
                textInfo.text.museumPrefix ||
                textInfo.text.museumNumber ||
                editText
              "
            >
              Museum Info: {{ textInfo.text.museumPrefix }}
              {{ textInfo.text.museumNumber }}
              <v-row v-if="editText">
                <v-col cols="8" sm="4">
                  <v-text-field
                    outlined
                    v-model="textInfo.text.museumPrefix"
                    label="Prefix"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="8" sm="4">
                  <v-text-field
                    outlined
                    v-model="textInfo.text.museumNumber"
                    label="Number"
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
            <div
              v-if="
                textInfo.text.publicationPrefix ||
                textInfo.text.publicationNumber ||
                editText
              "
            >
              Primary Publication Info: {{ textInfo.text.publicationPrefix }}
              {{ textInfo.text.publicationNumber }}
              <v-row v-if="editText">
                <v-col cols="8" sm="4">
                  <v-text-field
                    outlined
                    v-model="textInfo.text.publicationPrefix"
                    label="Prefix"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="8" sm="4">
                  <v-text-field
                    v-if="editText"
                    outlined
                    v-model="textInfo.text.publicationNumber"
                    label="Number"
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>
            <div>
              <div v-if="editText">
                <v-btn color="primary" width="90px" @click="editTextInfo"
                  >Save</v-btn
                >
                <v-btn
                  color="info"
                  width="90px"
                  class="white--text mx-4"
                  @click="cancelEditTextInfo"
                  >Cancel</v-btn
                >
              </div>
            </div>
          </div>
        </v-row>

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
        <template #title:post v-if="!disableEditing">
          <v-btn
            v-if="!isEditing && textInfo.canWrite"
            color="primary"
            :to="`/epigraphies/${textUuid}/edit`"
            class="mx-4"
            >Edit</v-btn
          >
          <v-btn
            v-if="canAddPictures"
            color="primary"
            @click="photosDialogOpen = true"
            >Add Photos</v-btn
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
        <oare-dialog
          v-model="photosDialogOpen"
          :title="`Add Photos to ${textInfo.text.name}`"
          submitText="Add Photos"
          closeOnSubmit
          :width="1500"
          @submit="uploadPhotos"
        >
          <add-photos inDialog @update-photos="setPhotosToAdd" />
        </oare-dialog>
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
import {
  LinkRow,
  ResourceRow,
  TextDiscourseRow,
  TextDraft,
  TextPhoto,
} from '@oare/types';
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
import AddPhotos from '@/views/Texts/CollectionTexts/AddTexts/Photos/AddPhotos.vue';

import { addNamesToTextPhotos } from '../CollectionTexts/AddTexts/utils/photos';
import { v4 } from 'uuid';

export interface DraftContent extends Pick<TextDraft, 'content' | 'notes'> {
  uuid: string | null;
}

export interface OriginalTextInfo {
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  primaryPublicationPrefix: string | null;
  primaryPublicationNumber: string | null;
}

export const EpigraphyReloadKey: InjectionKey<() => Promise<void>> = Symbol();

export default defineComponent({
  name: 'EpigraphyView',
  components: {
    EpigraphyEditor,
    Stoplight,
    EpigraphyImage,
    EpigraphyFullDisplay,
    AddPhotos,
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

    const hasEditPermission = computed(() =>
      store.getters.permissions
        .map(perm => perm.name)
        .includes('EDIT_TEXT_INFO')
    );

    const canAddPictures = computed(() =>
      store.getters.permissions
        .map(perm => perm.name)
        .includes('UPLOAD_EPIGRAPHY_IMAGES')
    );

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

    let editText = ref(false);

    const originalTextInfoObject = ref<OriginalTextInfo>({
      excavationPrefix: null,
      excavationNumber: null,
      museumPrefix: null,
      museumNumber: null,
      primaryPublicationPrefix: null,
      primaryPublicationNumber: null,
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

    const toggleTextInfo = function () {
      originalTextInfoObject.value.excavationPrefix =
        textInfo.value.text.excavationPrefix;
      originalTextInfoObject.value.excavationNumber =
        textInfo.value.text.excavationNumber;
      originalTextInfoObject.value.museumPrefix =
        textInfo.value.text.museumPrefix;
      originalTextInfoObject.value.museumNumber =
        textInfo.value.text.museumNumber;
      originalTextInfoObject.value.primaryPublicationPrefix =
        textInfo.value.text.publicationPrefix;
      originalTextInfoObject.value.primaryPublicationNumber =
        textInfo.value.text.publicationNumber;

      editText.value = !editText.value;
    };

    const cancelEditTextInfo = function () {
      textInfo.value.text.excavationPrefix =
        originalTextInfoObject.value.excavationPrefix;
      textInfo.value.text.excavationNumber =
        originalTextInfoObject.value.excavationNumber;
      textInfo.value.text.museumPrefix =
        originalTextInfoObject.value.museumPrefix;
      textInfo.value.text.museumNumber =
        originalTextInfoObject.value.museumNumber;
      textInfo.value.text.publicationPrefix =
        originalTextInfoObject.value.primaryPublicationPrefix;
      textInfo.value.text.publicationNumber =
        originalTextInfoObject.value.primaryPublicationNumber;

      editText.value = !editText.value;
    };

    const getTextInfo = async () => {
      if (localEpigraphyUnits) {
        textInfo.value = localEpigraphyUnits;
      } else if (textUuid) {
        textInfo.value = await server.getEpigraphicInfo(textUuid);
      }
    };

    const editTextInfo = async () => {
      await updateTextInfo();
      editText.value = false;
    };

    const updateTextInfo = async () => {
      try {
        await server.updateTextInfo(
          textInfo.value.text.uuid,
          textInfo.value.text.excavationPrefix,
          textInfo.value.text.excavationNumber,
          textInfo.value.text.museumPrefix,
          textInfo.value.text.museumNumber,
          textInfo.value.text.publicationPrefix,
          textInfo.value.text.publicationNumber
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding new form. Please try again.',
          err as Error
        );
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
            'Error updating text information. Please try again.',
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

    const photosDialogOpen = ref(false);
    const photosToAdd = ref<TextPhoto[]>([]);
    const setPhotosToAdd = (photos: TextPhoto[]) => {
      photosToAdd.value = photos;
    };
    const uploadPhotos = async () => {
      try {
        const photosWithName = await addNamesToTextPhotos(
          textInfo.value.text.excavationPrefix,
          textInfo.value.text.excavationNumber,
          textInfo.value.text.museumPrefix,
          textInfo.value.text.museumNumber,
          textInfo.value.text.publicationPrefix,
          textInfo.value.text.publicationNumber,
          photosToAdd.value
        );
        const resourceRows: ResourceRow[] = photosWithName.map(photo => ({
          uuid: v4(),
          sourceUuid: store.getters.user ? store.getters.user.uuid : null,
          type: 'img',
          container: 'oare-image-bucket',
          format: null,
          link: photo.name,
        }));

        const linkRows: LinkRow[] = resourceRows.map(resource => ({
          uuid: v4(),
          referenceUuid: textUuid || '',
          objUuid: resource.uuid,
        }));
        await server.addPhotosToText(resourceRows, linkRows);
        await Promise.all(
          photosWithName.map(photo => server.uploadImage(photo))
        );
        photosToAdd.value.forEach(photo => {
          if (photo.url) {
            imageUrls.value.push(photo.url);
          }
        });
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding photos to text. Please try again.',
          err as Error
        );
      }
    };

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
      cancelEditTextInfo,
      toggleTextInfo,
      editTextInfo,
      updateTextInfo,
      originalTextInfoObject,
      hasEditPermission,
      transliteration,
      editText,
      photosDialogOpen,
      setPhotosToAdd,
      uploadPhotos,
      canAddPictures,
    };
  },
});
</script>

<style scoped>
.relative {
  position: relative;
}
</style>
