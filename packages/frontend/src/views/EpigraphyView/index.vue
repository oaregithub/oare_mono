<template>
  <OareContentView :title="textName" :loading="loading">
    <template #header v-if="!hideDetails">
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <template #title:pre>
      <Stoplight :color="color" :colorMeaning="colorMeaning" />
    </template>
    <template #title:post v-if="canWrite && !hideDetails">
      <v-btn v-if="!isEditing" color="primary" @click="toggleEdit">Edit</v-btn>
    </template>
    <v-row>
      <v-col
        cols="12"
        :sm="hasPicture ? 7 : 12"
        :md="hasPicture ? 5 : 12"
        v-if="!isEditing"
      >
        <v-row>
          <EpigraphyReading
            :epigraphicUnits="epigraphicUnits"
            :markupUnits="markupUnits"
          />
        </v-row>
        <DiscourseReading :discourseUnits="discourseUnits" />
      </v-col>
      <v-col
        cols="12"
        :sm="hasPicture ? 7 : 12"
        :md="hasPicture ? 5 : 12"
        v-else
      >
        <EpigraphyEditor
          :sides="editorSideData"
          :textUuid="textUuid"
          ref="epigEditor"
          @save-draft="draftContent = $event"
          @close-editor="toggleEdit"
          :notes.sync="draftNotes"
        />
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
  EpigraphicUnitSide,
  DiscourseUnit,
  EpigraphicUnit,
  MarkupUnit,
} from '@oare/oare';
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
import router from '@/router';
import { getLetterGroup } from '../CollectionsView/utils';
import Stoplight from './Stoplight.vue';
import EpigraphyReading from './EpigraphyReading.vue';
import EpigraphyImage from './EpigraphyImage.vue';
import DiscourseReading from './DiscourseReading.vue';

interface EpigraphyState {
  loading: boolean;
  collection: string;
  canWrite: boolean;
  textName: string;
}

export interface EpigraphyEditorSideData {
  side: EpigraphicUnitSide | string;
  text: string;
}

export default defineComponent({
  name: 'EpigraphyView',
  components: {
    EpigraphyEditor,
    Stoplight,
    EpigraphyReading,
    EpigraphyImage,
    DiscourseReading,
  },
  props: {
    textUuid: {
      type: String,
      required: true,
    },
    hideDetails: {
      type: Boolean,
      default: false,
    },
  },

  setup({ textUuid }) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const epigraphicUnits = ref<EpigraphicUnit[]>([]);
    const markupUnits = ref<MarkupUnit[]>([]);

    const epigraphyState = reactive<EpigraphyState>({
      loading: false,
      collection: '',
      canWrite: false,
      textName: '',
    });

    let collection: Ref<{ uuid: string; name: string }> = ref({
      uuid: '',
      name: '',
    });
    const hasPicture = ref(false);
    let breadcrumbItems = computed(() => {
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
    let isEditing: Ref<boolean> = ref(false);
    let draftContent: Ref<EpigraphyEditorSideData[] | null> = ref(null);
    const draftNotes = ref('');
    const cdli: Ref<string | null> = ref(null);
    const color = ref('');
    const colorMeaning = ref('');

    const toggleEdit = () => {
      isEditing.value = !isEditing.value;
    };

    const editorSideData = computed(() => {
      if (draftContent.value) {
        return draftContent.value;
      }

      const sideData: EpigraphyEditorSideData[] = [];
      const draftRenderer = createTabletRenderer(
        epigraphicUnits.value,
        markupUnits.value,
        { lineNumbers: true }
      );
      for (const side of draftRenderer.sides) {
        sideData.push({
          side: side,
          text: draftRenderer.sideReading(side),
        });
      }
      return sideData;
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
        } = await server.getEpigraphicInfo(textUuid);
        color.value = epColor;
        colorMeaning.value = epColorMeaning;
        discourseUnits.value = textDiscourseUnits;
        cdli.value = cdliNum;
        epigraphicUnits.value = units;
        markupUnits.value = markups;

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
        // If the user is an editor, get the draft content
        if (epigraphyState.canWrite) {
          const res = await server.getSingleDraft(textUuid);
          draftContent.value = res.content;
          draftNotes.value = res.notes;
        }
      }
    });

    const isAdmin = computed(() => store.getters.isAdmin);

    return {
      ...toRefs(epigraphyState),
      isEditing,
      toggleEdit,
      editorSideData,
      draftContent,
      draftNotes,
      discourseUnits,
      breadcrumbItems,
      isAdmin,
      cdli,
      color,
      colorMeaning,
      hasPicture,
      epigraphicUnits,
      markupUnits,
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
