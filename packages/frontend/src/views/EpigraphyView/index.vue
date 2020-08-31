<template>
  <OareContentView :title="textName" :loading="loading">
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <template #title:post v-if="canWrite">
      <v-btn v-if="!isEditing" color="primary" @click="toggleEdit">Edit</v-btn>
    </template>
    <div v-if="!isEditing">
      <div v-if="renderer">
        <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
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
      <p
        v-if="discourseRenderer && isAdmin"
        class="mt-5 oare-title font-weight-regular"
      >
        <span v-for="line in discourseRenderer.lines" :key="line" class="mr-1">
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
        <template #label="{item}">
          <div
            :class="`${discourseColor(item.type)}--text`"
            style="white-space: normal"
            v-html="discourseReading(item)"
          ></div>
        </template>
      </v-treeview>
    </div>
    <v-container v-else>
      <EpigraphyEditor
        :sides="editorSideData"
        :textUuid="textUuid"
        ref="epigEditor"
        @save-draft="draftContent = $event"
        @close-editor="toggleEdit"
        :draftSaveLoading.sync="draftSaveLoading"
      />
    </v-container>
  </OareContentView>
</template>

<script lang="ts">
import { mapActions } from "vuex";
import {
  createTabletRenderer,
  DiscourseRenderer,
  DiscourseHtmlRenderer,
  EpigraphicUnit,
  MarkupUnit,
  EpigraphicUnitSide,
  DiscourseUnit,
} from "oare";
import TabletRenderer from "oare/build/TabletRenderer";
import {
  defineComponent,
  reactive,
  toRefs,
  ref,
  Ref,
  onMounted,
  computed,
} from "@vue/composition-api";
import store from "@/store";

import server from "../../serverProxy";

import EpigraphyEditor from "./EpigraphyEditor.vue";
import serverProxy from "../../serverProxy";
import router from "@/router";
import { getLetterGroup } from "../CollectionsView/utils";

interface EpigraphyState {
  loading: boolean;
  collection: string;
  canWrite: boolean;
  textName: string;
}

interface EpigraphyEditorSideData {
  side: EpigraphicUnitSide;
  text: string;
}

export default defineComponent({
  name: "EpigraphyView",
  components: {
    EpigraphyEditor,
  },
  props: {
    textUuid: {
      type: String,
      required: true,
    },
  },

  setup({ textUuid }) {
    const epigraphyState = reactive<EpigraphyState>({
      loading: false,
      collection: "",
      canWrite: false,
      textName: "",
    });

    let renderer: Ref<TabletRenderer | null> = ref(null);
    let collection: Ref<{ uuid: string; name: string }> = ref({
      uuid: "",
      name: "",
    });
    let breadcrumbItems = computed(() => {
      const letterGroup = getLetterGroup(collection.value.name);

      return [
        {
          link: "/collections/A-J",
          text: "Texts",
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
    let draftSaveLoading: Ref<boolean> = ref(false);

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
        case "paragraph":
          return "red";
        case "sentence":
          return "blue";
        case "clause":
          return "purple";
        case "phrase":
          return "green";
        default:
          return "black";
      }
    };

    const discourseReading = (discourse: DiscourseUnit) => {
      let reading;
      if (
        (discourse.type === "discourseUnit" || discourse.type === "sentence") &&
        discourse.translation
      ) {
        reading = discourse.translation;
      } else if (
        (discourse.type === "paragraph" ||
          discourse.type === "clause" ||
          discourse.type === "phrase") &&
        discourse.paragraphLabel
      ) {
        reading = discourse.paragraphLabel;
      } else if (discourse.type === "word") {
        if (discourse.transcription && discourse.spelling) {
          reading = `${discourse.transcription} (${discourse.spelling})`;
        } else {
          reading = discourse.spelling;
        }
      } else {
        reading = discourse.spelling;
      }

      if (discourse.type === "paragraph") {
        reading = `<strong><em>${reading}</em></strong>`;
      } else if (discourse.type === "clause" || discourse.type === "phrase") {
        reading = `<em>${reading}</em>`;
      }
      return reading;
    };

    onMounted(async () => {
      try {
        epigraphyState.loading = true;
        const {
          collection: collectionInfo,
          units,
          canWrite,
          textName,
        } = await server.getEpigraphicInfo(textUuid);
        let markupUnits = await server.getEpigraphicMarkups(textUuid);
        let epigUnits = units;

        if (collectionInfo) {
          collection.value = collectionInfo;
        }

        renderer.value = createTabletRenderer(epigUnits, markupUnits, {
          textFormat: "html",
        });

        discourseUnits.value = await server.getDiscourseUnits(textUuid);
        discourseRenderer.value = new DiscourseHtmlRenderer(
          discourseUnits.value
        );
        epigraphyState.canWrite = canWrite;
        epigraphyState.textName = textName;

        // If the user is an editor, get the draft content
        if (epigraphyState.canWrite) {
          const res = await serverProxy.getDrafts(textUuid);
          if (res.length > 0) {
            // Should only be one entry because it's one text
            draftContent.value = res[0].content;
          }
        }
      } catch (err) {
        if (err.response) {
          if (err.response.status === 403) {
            router.replace({ name: "403" });
          }
        } else {
          console.error(err.message);
        }
      } finally {
        epigraphyState.loading = false;
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
      discourseUnits,
      discourseRenderer,
      breadcrumbItems,
      discourseColor,
      discourseReading,
      isAdmin,
    };
  },
});
</script>

<style scoped>
.sideName {
  min-width: 50px;
}
</style>
