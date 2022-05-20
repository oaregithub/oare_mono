<template>
  <div>
    <p class="mt-5 oare-title font-weight-regular">
      <span v-for="side in discourseRenderer.sides" :key="side">
        <span class="mr-1">({{ getSideByNumber(side) }})</span>
        <span
          v-for="line in discourseRenderer.linesOnSide(side)"
          :key="line"
          class="mr-1"
        >
          <sup>{{ formatLineNumber(line, false) }})</sup
          ><span v-html="discourseRenderer.lineReading(line)" />
        </span>
      </span>
    </p>
    <v-row align="center" v-if="canInsertParentDiscourse">
      <v-switch
        v-model="articulateDiscourseHierarchy"
        label="Articulate Discourse Hierarchy"
        class="mx-6"
      />
    </v-row>
    <v-row
      align="center"
      v-if="canInsertParentDiscourse && articulateDiscourseHierarchy"
    >
      <v-btn
        :disabled="discourseSelections.length < 1"
        color="primary"
        @click="insertParentDiscourseDialog = true"
        class="mx-6 mb-6"
        >Insert Parent Discourse</v-btn
      >
      <insert-parent-discourse-dialog
        v-model="insertParentDiscourseDialog"
        :key="insertParentDiscourseKey"
        :discourseSelections="discourseSelections"
        :textUuid="textUuid"
      />
    </v-row>
    <v-treeview
      open-all
      :items="discourseUnits"
      item-children="units"
      item-key="uuid"
      item-text="spelling"
    >
      <template #label="{ item }">
        <v-row class="ma-0 pa-0" align="center">
          <v-checkbox
            v-if="articulateDiscourseHierarchy && item.type !== 'discourseUnit'"
            hide-details
            dense
            multiple
            v-model="discourseSelections"
            :value="item"
            class="ml-2 my-2"
            :disabled="!canSelectDiscourseUnit(item)"
          />
          <span v-if="editingUuid !== item.uuid" class="ma-0 pa-0">
            <v-btn
              icon
              v-if="
                (item.translation || item.type === 'discourseUnit') &&
                allowEditing
              "
              @click="startEdit(item)"
              class="mr-1 test-discourse-startedit"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-menu
              :close-on-content-click="false"
              offset-x
              open-on-hover
              :open-delay="400"
            >
              <template v-slot:activator="{ on, attrs }">
                <span
                  :class="`${discourseColor(item.type)}--text`"
                  style="white-space: normal"
                  v-html="discourseReading(item)"
                  v-bind="attrs"
                  v-on="on"
                  class="pr-8"
                ></span>
              </template>

              <discourse-properties-card
                :discourseUuid="item.uuid"
                :key="item.uuid"
              />
            </v-menu>
          </span>
          <div
            v-else-if="
              (item.translation || item.type === 'discourseUnit') &&
              allowEditing
            "
          >
            <v-textarea
              label="Translation"
              auto-grow
              outlined
              rows="1"
              v-model="inputTranslation"
              class="ma-1 test-discourse-box"
              dense
              hide-details
            ></v-textarea>
            <OareLoaderButton
              :loading="editLoading"
              color="primary"
              @click="discourseEdit(item)"
              class="ma-1 test-discourse-button"
              >Save</OareLoaderButton
            >
            <v-btn color="primary" @click="editingUuid = ''" class="ma-1"
              >Cancel</v-btn
            >
          </div>
        </v-row>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  PropType,
  computed,
  watch,
} from '@vue/composition-api';
import { DiscourseUnit, EpigraphicUnitSide } from '@oare/types';
import { DiscourseHtmlRenderer } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import DiscoursePropertiesCard from './DiscoursePropertiesCard.vue';
import insertParentDiscourseDialog from './InsertParentDiscouresDialog.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    DiscoursePropertiesCard,
    insertParentDiscourseDialog,
  },
  setup({ discourseUnits }) {
    const discourseRenderer = new DiscourseHtmlRenderer(discourseUnits);
    const server = sl.get('serverProxy');
    const editingUuid = ref('');
    const inputTranslation = ref('');
    const store = sl.get('store');
    const actions = sl.get('globalActions');

    const allowEditing = computed(() =>
      store.hasPermission('EDIT_TRANSLATION')
    );

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
      } else if (discourse.type === 'paragraph' && discourse.paragraphLabel) {
        reading = `<strong><em>${discourse.paragraphLabel}</em></strong>`;
      } else if (
        (discourse.type === 'clause' || discourse.type === 'phrase') &&
        discourse.paragraphLabel
      ) {
        reading = `<em>${discourse.paragraphLabel}</em>`;
      } else if (
        (discourse.type === 'word' || discourse.type === 'number') &&
        discourse.transcription &&
        discourse.explicitSpelling
      ) {
        reading = `${discourse.transcription} (${discourse.explicitSpelling})`;
      } else {
        reading = discourse.explicitSpelling;
      }

      return reading || '';
    };

    const startEdit = (discourse: DiscourseUnit) => {
      editingUuid.value = discourse.uuid || '';
      if (discourse.translation) {
        inputTranslation.value = discourse.translation || '';
      } else {
        inputTranslation.value = discourse.explicitSpelling || '';
      }
    };

    const editLoading = ref(false);
    const discourseEdit = async (discourse: DiscourseUnit) => {
      try {
        if (discourse.translation) {
          await server.updateDiscourseTranslation(
            discourse.uuid,
            inputTranslation.value
          );
        } else {
          await server.createDiscourseTranslation(
            discourse.uuid,
            inputTranslation.value
          );
        }
        editLoading.value = true;
      } catch (err) {
        actions.showErrorSnackbar('Failed to update database', err as Error);
      } finally {
        discourse.translation = inputTranslation.value;
        editingUuid.value = '';
        editLoading.value = false;
      }
    };

    const getSideByNumber = (number: number | null): EpigraphicUnitSide => {
      switch (number) {
        case 1:
          return 'obv.';
        case 2:
          return 'lo.e.';
        case 3:
          return 'rev.';
        case 4:
          return 'u.e.';
        case 5:
          return 'le.e.';
        default:
          return 'r.e.';
      }
    };

    const articulateDiscourseHierarchy = ref(false);

    const discourseSelections = ref<DiscourseUnit[]>([]);

    const canSelectDiscourseUnit = (unit: DiscourseUnit): boolean => {
      if (discourseSelections.value.length === 0) {
        return true;
      }
      if (discourseSelections.value[0].parentUuid !== unit.parentUuid) {
        return false;
      }
      const childNumArray = discourseSelections.value.map(
        selection => selection.childNum!
      );
      const minimumChildNumInText = Math.min(...childNumArray);
      const maximumChildNumInText = Math.max(...childNumArray);
      if (
        unit.childNum === minimumChildNumInText - 1 ||
        unit.childNum === maximumChildNumInText + 1 ||
        unit.childNum === minimumChildNumInText ||
        unit.childNum === maximumChildNumInText
      ) {
        return true;
      }
      return false;
    };

    watch(articulateDiscourseHierarchy, () => {
      if (!articulateDiscourseHierarchy.value) {
        discourseSelections.value = [];
      }
    });

    const insertParentDiscourseDialog = ref(false);

    const insertParentDiscourseKey = ref(false);
    watch(insertParentDiscourseDialog, () => {
      if (insertParentDiscourseDialog.value) {
        insertParentDiscourseKey.value = !insertParentDiscourseKey.value;
      } else {
        discourseSelections.value = [];
        articulateDiscourseHierarchy.value = false;
      }
    });

    const canInsertParentDiscourse = computed(() =>
      store.hasPermission('INSERT_PARENT_DISCOURSE_ROWS')
    );

    return {
      discourseRenderer,
      discourseColor,
      discourseReading,
      startEdit,
      discourseEdit,
      formatLineNumber,
      editingUuid,
      inputTranslation,
      allowEditing,
      editLoading,
      getSideByNumber,
      articulateDiscourseHierarchy,
      discourseSelections,
      canSelectDiscourseUnit,
      insertParentDiscourseDialog,
      insertParentDiscourseKey,
      canInsertParentDiscourse,
    };
  },
});
</script>
