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
            blockContinueText="To continue, please complete the required item(s)"
            @next="next"
          />
        </v-stepper-content>

        <v-stepper-content step="2">
          <add-photos @update-photos="setPhotos" />
          <stepper-button @next="next" @previous="previous" />
        </v-stepper-content>

        <v-stepper-content step="3">
          <add-text-editor
            @update-editor-content="setEditorContent"
            @step-complete="stepThreeComplete = $event"
          />
          <stepper-button
            :blockContinue="!stepThreeComplete"
            blockContinueText="To continue, there must be at least one side. No empty sides,
            columns, or rows are allowed."
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
            @update-discourse-rows="updateDiscourseRows($event)"
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
            :blockContinue="true"
            blockContinueText="Coming Soon"
            @previous="previous"
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
} from '@oare/types';
import {
  convertTablesToUnits,
  createNewTextTables,
} from './utils';

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
    StepperButton,
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
        discourseUnits: [],
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

    const createTextTables = ref<CreateTextTables>();
    const buildTables = async () => {
      if (textInfo.value && editorContent.value) {
        createTextTables.value = await createNewTextTables(
          textInfo.value,
          editorContent.value
        );
      }
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
      next,
      previous,
      createTextTables,
      updateDiscourseRows,
      stepOneComplete,
      stepThreeComplete,
      buildTables,
    };
  },
});
</script>
