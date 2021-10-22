<template>
  <OareContentView
    :title="`Add New Text to ${collectionName}`"
    :loading="loading"
  >
    <v-stepper v-model="step">
      <v-stepper-header>
        <v-stepper-step :complete="step > 1" step="1">
          Text Info
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 2" step="2">
          Upload Photos
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 3" step="3"> Editor </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 4" step="4">
          Lexical Info
        </v-stepper-step>
        <v-divider />
        <v-stepper-step step="5"> Final Preview </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <text-info-set
            @update-text-info="setTextInfo"
            @step-complete="stepOneComplete = $event"
          />

          <v-btn
            color="primary"
            class="ml-4"
            @click="next(false)"
            :disabled="!stepOneComplete"
          >
            Continue
          </v-btn>
          <span v-if="!stepOneComplete" class="red--text ml-4"
            >To continue, please complete the required item(s)</span
          >
        </v-stepper-content>

        <v-stepper-content step="2">
          <add-photos @update-photos="setPhotos" />

          <v-btn text @click="previous(false)" class="mx-3"> Back </v-btn>
          <v-btn color="primary" @click="next(false)"> Continue </v-btn>
        </v-stepper-content>

        <v-stepper-content step="3">
          <add-text-editor
            @update-editor-content="setEditorContent"
            @step-complete="stepThreeComplete = $event"
          />

          <v-btn text @click="previous(false)" class="mx-3"> Back </v-btn>
          <v-btn
            color="primary"
            @click="next(true)"
            :disabled="!stepThreeComplete"
          >
            Continue
          </v-btn>

          <span v-if="!stepThreeComplete" class="red--text ml-4"
            >To continue, there must be at least one side. No empty sides,
            columns, or rows are allowed.</span
          >
        </v-stepper-content>

        <v-stepper-content step="4">
          <connect-discourse
            :epigraphicUnits="epigraphyDetails.units"
            :discourseRows="createTextTables ? createTextTables.discourses : []"
            @update-discourse-rows="updateDiscourseRows($event)"
          />

          <v-btn text @click="previous(true)" class="mx-3"> Back </v-btn>
          <v-btn color="primary" @click="next(false)"> Continue </v-btn>
        </v-stepper-content>

        <v-stepper-content step="5">
          <final-preview
            v-if="epigraphyReady"
            :epigraphyUnits="epigraphyDetails"
            :photoUrls="photoUrls"
            :localDiscourseInfo="
              createTextTables ? createTextTables.discourses : []
            "
          />

          <v-btn text class="mx-3" @click="previous(false)"> Back </v-btn>
          <v-btn color="primary" disabled> Submit </v-btn>
          <span class="red--text ml-4">Coming Soon</span>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  ComputedRef,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddTextEditor from './Editor/AddTextEditor.vue';
import TextInfoSet from './TextInfo/TextInfoSet.vue';
import AddPhotos from './Photos/AddPhotos.vue';
import ConnectDiscourse from './Discourse/ConnectDiscourse.vue';
import EpigraphyView from '@/views/Texts/EpigraphyView/index.vue';
import FinalPreview from '@/views/Texts/CollectionTexts/AddTexts/Preview/FinalPreview.vue';
import {
  AddTextEditorContent,
  AddTextInfo,
  TextPhoto,
  EpigraphyResponse,
  CreateTextTables,
  TextDiscourseRow,
} from '@oare/types';
import { convertTablesToUnits, createNewTextTables } from './utils';

export default defineComponent({
  props: {
    collectionUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    AddTextEditor,
    TextInfoSet,
    AddPhotos,
    EpigraphyView,
    ConnectDiscourse,
    FinalPreview,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const collectionName = ref('');
    const step = ref(1);
    const loading = ref(false);

    const stepOneComplete = ref(false);
    const stepThreeComplete = ref(false);

    const textInfo = ref<AddTextInfo>();
    const setTextInfo = (updatedTextInfo: AddTextInfo) => {
      textInfo.value = updatedTextInfo;
    };

    const photos = ref<TextPhoto[]>([]);
    const setPhotos = (updatedPhotos: TextPhoto[]) => {
      photos.value = updatedPhotos;
    };
    const photoUrls = computed(() =>
      photos.value.filter(photo => photo.url).map(photo => photo.url)
    );

    const editorContent = ref<AddTextEditorContent>();
    const setEditorContent = (updatedEditorContent: AddTextEditorContent) => {
      editorContent.value = updatedEditorContent;
    };

    const epigraphyReady = ref(false);
    const epigraphyDetails: ComputedRef<EpigraphyResponse> = computed(() => {
      return {
        canWrite: false,
        textName:
          textInfo.value && textInfo.value.textName
            ? textInfo.value.textName
            : '',
        collection: {
          uuid: props.collectionUuid,
          name: collectionName.value,
        },
        cdliNum:
          textInfo.value && textInfo.value.cdliNum
            ? textInfo.value.cdliNum
            : '',
        units: createTextTables.value
          ? convertTablesToUnits(createTextTables.value)
          : [],
        color: '',
        colorMeaning: '',
        discourseUnits: [], // Will add later
      };
    });

    const createTextTables = ref<CreateTextTables>();

    onMounted(async () => {
      loading.value = true;
      try {
        collectionName.value = (
          await server.getCollectionInfo(props.collectionUuid)
        ).name;
      } catch {
        actions.showErrorSnackbar(
          'Error loading collection name. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    const next = async (completeEpigraphy = false) => {
      if (completeEpigraphy) {
        if (editorContent.value && textInfo.value) {
          try {
            createTextTables.value = await createNewTextTables(
              textInfo.value,
              editorContent.value
            );
          } catch (err) {
            actions.showErrorSnackbar(
              'Error build new text preview. Please try again.'
            );
          }
        }
        epigraphyReady.value = true;
      }
      step.value += 1;
    };

    const previous = (destroyEpigraphy = false) => {
      if (destroyEpigraphy) {
        epigraphyReady.value = false;
      }
      step.value -= 1;
    };

    const updateDiscourseRows = (discourses: TextDiscourseRow[]) => {
      if (createTextTables.value) {
        createTextTables.value = {
          ...createTextTables.value,
          discourses,
        };
      }
    };

    return {
      collectionName,
      step,
      loading,
      setTextInfo,
      setEditorContent,
      setPhotos,
      photoUrls,
      epigraphyDetails,
      epigraphyReady,
      next,
      previous,
      createTextTables,
      updateDiscourseRows,
      stepOneComplete,
      stepThreeComplete,
    };
  },
});
</script>
