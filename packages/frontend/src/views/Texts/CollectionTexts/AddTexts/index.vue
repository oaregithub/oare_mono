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
          <stepper-button
            :showBackButton="false"
            :blockContinue="!stepOneComplete"
            blockContinueText="To continue, please include a text name. Please also include a prefix and number for at least one of the following: Excavation, Museum, Publication"
            @next="next"
          />
        </v-stepper-content>

        <v-stepper-content step="2">
          <add-photos
            v-if="step >= 2"
            @update-photos="setPhotos"
            @step-complete="stepTwoComplete = $event"
          />
          <stepper-button
            :blockContinue="!stepTwoComplete"
            blockContinueText="To continue, each photo needs to have a side and view selected. Please make sure you also have uploaded photos for each selector."
            @next="next"
            @previous="previous"
          />
        </v-stepper-content>

        <v-stepper-content step="3">
          <add-text-editor
            @update-editor-content="setEditorContent"
            @step-complete="stepThreeComplete = $event"
          />
          <stepper-button
            :blockContinue="!stepThreeComplete"
            blockContinueText="To continue, there must be at least one side. No empty sides,
            columns, or rows are allowed. All signs and markup must be valid."
            :continueAction="buildTables"
            @next="next"
            @previous="previous"
          />
        </v-stepper-content>

        <v-stepper-content step="4">
          <connect-discourse
            v-if="step >= 4"
            :epigraphicUnits="epigraphyDetails.units"
            :discourseRows="createTextTables ? createTextTables.discourses : []"
            :manualDiscourseSelections="manuallySelectedDiscourses"
            @update-discourse-rows="updateDiscourseRows($event)"
            @update-manual-selections="updateManualSelections($event)"
          />
          <stepper-button @next="next" @previous="previous" />
        </v-stepper-content>

        <v-stepper-content step="5">
          <final-preview
            v-if="step >= 5"
            :epigraphyUnits="epigraphyDetails"
            :photoUrls="photoUrls"
            :localDiscourseInfo="
              createTextTables ? createTextTables.discourses : []
            "
          />
          <stepper-button
            continueButtonText="Submit"
            :continueAction="createText"
            @previous="previous"
            @next="pushToText"
          />
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
  onBeforeMount,
  onBeforeUnmount,
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
import StepperButton from './components/StepperButton.vue';
import {
  AddTextEditorContent,
  AddTextInfo,
  TextPhoto,
  EpigraphyResponse,
  CreateTextTables,
  TextDiscourseRow,
  TextPhotoWithName,
} from '@oare/types';
import { convertTablesToUnits } from './utils/convertTablesToUnits';
import { createNewTextTables } from './utils/buildTables';
import { addNamesToTextPhotos } from './utils/photos';

export default defineComponent({
  props: {
    collectionUuid: {
      type: String,
      required: true,
    },
  },
  beforeRouteLeave(_to, _from, next) {
    if (!this.isDirty) {
      next();
    } else {
      this.actions.showUnsavedChangesWarning(next);
    }
  },
  components: {
    AddTextEditor,
    TextInfoSet,
    AddPhotos,
    EpigraphyView,
    ConnectDiscourse,
    FinalPreview,
    StepperButton,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');

    const collectionName = ref('');
    const step = ref(1);
    const loading = ref(false);

    const stepOneComplete = ref(false);
    const stepTwoComplete = ref(false);
    const stepThreeComplete = ref(false);

    const isDirty = ref(true);

    const textInfo = ref<AddTextInfo>();
    const setTextInfo = (updatedTextInfo: AddTextInfo) => {
      textInfo.value = updatedTextInfo;
    };

    const photos = ref<TextPhoto[]>([]);
    const photosWithName = ref<TextPhotoWithName[]>([]);
    const setPhotos = (updatedPhotos: TextPhoto[]) => {
      photos.value = updatedPhotos;
    };
    const photoUrls = computed(() =>
      photosWithName.value.filter(photo => photo.url).map(photo => photo.url)
    );

    const editorContent = ref<AddTextEditorContent>();
    const setEditorContent = (updatedEditorContent: AddTextEditorContent) => {
      editorContent.value = updatedEditorContent;
    };

    const epigraphyDetails: ComputedRef<EpigraphyResponse> = computed(() => {
      return {
        canWrite: false,
        text: {
          uuid: createTextTables.value ? createTextTables.value.text.uuid : '',
          type: 'logosyllabic',
          name:
            textInfo.value && textInfo.value.textName
              ? textInfo.value.textName
              : '',
          excavationPrefix:
            textInfo.value && textInfo.value.excavationPrefix
              ? textInfo.value.excavationPrefix
              : '',
          excavationNumber:
            textInfo.value && textInfo.value.excavationNumber
              ? textInfo.value.excavationNumber
              : '',
          museumPrefix:
            textInfo.value && textInfo.value.museumPrefix
              ? textInfo.value.museumPrefix
              : '',
          museumNumber:
            textInfo.value && textInfo.value.museumNumber
              ? textInfo.value.museumNumber
              : '',
          publicationPrefix:
            textInfo.value && textInfo.value.publicationPrefix
              ? textInfo.value.publicationPrefix
              : '',
          publicationNumber:
            textInfo.value && textInfo.value.publicationNumber
              ? textInfo.value.publicationNumber
              : '',
        },
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
        discourseUnits: [],
        hasEpigraphy: true,
      };
    });

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

    const next = () => (step.value += 1);
    const previous = () => (step.value -= 1);

    const pushToText = () => {
      if (createTextTables.value) {
        router.push(`/epigraphies/${createTextTables.value.text.uuid}`);
      }
    };

    const createText = async () => {
      if (createTextTables.value) {
        try {
          isDirty.value = false;
          await server.createText(createTextTables.value);
          await Promise.all(
            photosWithName.value.map(photo => server.uploadImage(photo))
          );
        } catch (err) {
          actions.showErrorSnackbar(
            'Error creating text. Please try again',
            err as Error
          );
        }
      }
    };

    const createTextTables = ref<CreateTextTables>();
    const persistentDiscourseStorage = ref<{ [uuid: string]: string | null }>(
      {}
    );
    const manuallySelectedDiscourses = ref<string[]>([]);
    const updateManualSelections = (discourseUuid: string) => {
      manuallySelectedDiscourses.value =
        manuallySelectedDiscourses.value.filter(uuid => uuid !== discourseUuid);
      manuallySelectedDiscourses.value.push(discourseUuid);
    };
    const buildTables = async () => {
      if (textInfo.value && editorContent.value) {
        photosWithName.value = await addNamesToTextPhotos(
          textInfo.value.excavationPrefix,
          textInfo.value.excavationNumber,
          textInfo.value.museumPrefix,
          textInfo.value.museumNumber,
          textInfo.value.publicationPrefix,
          textInfo.value.publicationNumber,
          photos.value
        );

        createTextTables.value = await createNewTextTables(
          textInfo.value,
          editorContent.value,
          persistentDiscourseStorage.value,
          photosWithName.value,
          props.collectionUuid
        );
      }
      if (createTextTables.value) {
        createTextTables.value.discourses.forEach(discourse => {
          persistentDiscourseStorage.value[discourse.uuid] =
            discourse.spellingUuid;
        });
      }
    };

    const updateDiscourseRows = (discourses: TextDiscourseRow[]) => {
      if (createTextTables.value) {
        createTextTables.value = {
          ...createTextTables.value,
          discourses,
        };
        createTextTables.value.discourses.forEach(row => {
          persistentDiscourseStorage.value[row.uuid] = row.spellingUuid;
        });
      }
    };

    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    onBeforeMount(() => {
      window.addEventListener('beforeunload', beforeUnloadHandler);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    });

    return {
      actions,
      collectionName,
      step,
      loading,
      setTextInfo,
      setEditorContent,
      setPhotos,
      photoUrls,
      epigraphyDetails,
      next,
      previous,
      createTextTables,
      updateDiscourseRows,
      stepOneComplete,
      stepTwoComplete,
      stepThreeComplete,
      buildTables,
      pushToText,
      createText,
      manuallySelectedDiscourses,
      updateManualSelections,
      isDirty,
    };
  },
});
</script>
