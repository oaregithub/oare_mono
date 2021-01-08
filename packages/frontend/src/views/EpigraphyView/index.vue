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
          <div v-if="renderer" class="mr-10">
            <div
              v-for="sideName in renderer.sides"
              :key="sideName"
              class="d-flex"
            >
              <div class="sideName oare-title mr-4">
                {{ sideName }}
              </div>
              <div>
                <div
                  v-for="lineNum in renderer.linesOnSide(sideName)"
                  :key="lineNum"
                  class="oare-title"
                >
                  <sup>{{ lineNum }}.&nbsp;</sup>
                  <span v-html="renderer.lineReading(lineNum)" />
                </div>
              </div>
            </div>
          </div>
        </v-row>
        <p
          v-if="discourseRenderer && isAdmin"
          class="mt-5 oare-title font-weight-regular"
        >
          <span
            v-for="line in discourseRenderer.lines"
            :key="line"
            class="mr-1"
          >
            <sup>{{ line }})</sup
            ><span v-html="discourseRenderer.lineReading(line)" />
          </span>
        </p>
        <v-treeview
          v-if="isAdmin"
          open-all
          dense
          :items="discourseUnits"
          item-children="units"
          item-key="uuid"
          item-text="spelling"
        >
          <template #label="{ item }">
            <div
              :class="`${discourseColor(item.type)}--text`"
              style="white-space: normal"
              v-html="discourseReading(item)"
            ></div>
          </template>
        </v-treeview>
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
          :draftSaveLoading.sync="draftSaveLoading"
          :notes.sync="draftNotes"
        />
      </v-col>
      <v-col cols="12" sm="5" md="7" v-if="cdli && isAdmin" class="relative">
        <img
          v-if="!errors.photo"
          :src="`https://cdli.ucla.edu/dl/photo/${cdli}.jpg`"
          @error="errors.photo = true"
          class="cdliImage"
          :class="{ fixed: $vuetify.breakpoint.smAndUp }"
          @load="hasPicture = true"
        />
        <img
          v-else-if="!errors.lineart"
          :src="`https://cdli.ucla.edu/dl/lineart/${cdli}_l.jpg`"
          @error="
            errors.lineart = true;
            cdli = null;
          "
          class="cdliImage"
          :class="{ fixed: $vuetify.breakpoint.smAndUp }"
          @load="hasPicture = true"
        />
      </v-col>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import { mapActions } from 'vuex';
import {
  createTabletRenderer,
  DiscourseRenderer,
  DiscourseHtmlRenderer,
  EpigraphicUnit,
  MarkupUnit,
  EpigraphicUnitSide,
  DiscourseUnit,
  TabletRenderer,
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

    const epigraphyState = reactive<EpigraphyState>({
      loading: false,
      collection: '',
      canWrite: false,
      textName: '',
    });

    let renderer: Ref<TabletRenderer | null> = ref(null);
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
    let discourseRenderer: Ref<DiscourseRenderer | null> = ref(null);
    let isEditing: Ref<boolean> = ref(false);
    let draftContent: Ref<EpigraphyEditorSideData[] | null> = ref(null);
    const draftNotes = ref('');
    let draftSaveLoading: Ref<boolean> = ref(false);
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

      if (!renderer.value) {
        return [];
      }

      const sideData: EpigraphyEditorSideData[] = [];
      const draftRenderer = createTabletRenderer(
        renderer.value.getEpigraphicUnits(),
        renderer.value.getMarkupUnits(),
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

    const discourseColor = (discourseType: string) => {
      switch (discourseType) {
        case 'paragraph':
          return 'red';
        case 'sentence':
          return 'blue';
        case 'clause':
          return 'purple';
        case 'phrase':
          return 'green';
        default:
          return 'black';
      }
    };

    const discourseReading = (discourse: DiscourseUnit) => {
      let reading;
      if (
        (discourse.type === 'discourseUnit' || discourse.type === 'sentence') &&
        discourse.translation
      ) {
        reading = discourse.translation;
      } else if (
        (discourse.type === 'paragraph' ||
          discourse.type === 'clause' ||
          discourse.type === 'phrase') &&
        discourse.paragraphLabel
      ) {
        reading = discourse.paragraphLabel;
      } else if (discourse.type === 'word') {
        if (discourse.transcription && discourse.spelling) {
          reading = `${discourse.transcription} (${discourse.spelling})`;
        } else {
          reading = discourse.spelling;
        }
      } else {
        reading = discourse.spelling;
      }

      if (discourse.type === 'paragraph') {
        reading = `<strong><em>${reading}</em></strong>`;
      } else if (discourse.type === 'clause' || discourse.type === 'phrase') {
        reading = `<em>${reading}</em>`;
      }
      return reading;
    };

    onMounted(async () => {
      try {
        epigraphyState.loading = true;
        const {
          collection: collectionInfo,
          units: epigUnits,
          canWrite,
          textName,
          cdliNum,
          color: epColor,
          colorMeaning: epColorMeaning,
          markups: markupUnits,
          discourseUnits: textDiscourseUnits,
        } = await server.getEpigraphicInfo(textUuid);
        color.value = epColor;
        colorMeaning.value = epColorMeaning;
        discourseUnits.value = textDiscourseUnits;
        cdli.value = cdliNum;

        if (collectionInfo) {
          collection.value = collectionInfo;
        }

        renderer.value = createTabletRenderer(epigUnits, markupUnits, {
          textFormat: 'html',
          admin: store.getters.isAdmin,
        });
        discourseRenderer.value = new DiscourseHtmlRenderer(
          discourseUnits.value
        );
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
      renderer,
      isEditing,
      toggleEdit,
      editorSideData,
      draftSaveLoading,
      draftContent,
      draftNotes,
      discourseUnits,
      discourseRenderer,
      breadcrumbItems,
      discourseColor,
      discourseReading,
      isAdmin,
      cdli,
      errors: ref({
        photo: false,
        lineart: false,
      }),
      color,
      colorMeaning,
      hasPicture,
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

.fixed {
  position: fixed;
}

.cdliImage {
  max-height: 50vh;

  @media (min-height: 660px) {
    max-height: 65vh;
  }

  @media (min-height: 1000px) {
    max-height: 80vh;
  }
}
</style>
