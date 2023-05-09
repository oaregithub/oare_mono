<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :title="title"
    @submit="clearRoute"
    :submitLoading="individualClearLoading"
    :submitDisabled="!routeToClear || numMatchingKeys === 0"
    :showActionsBar="!!modeSelection"
    :width="600"
  >
    <template #pre-actions v-if="modeSelection">
      <v-btn @click="handleBack" text color="primary" small>
        <v-icon x-small class="mr-1">mdi-arrow-left-thin</v-icon>
        Back</v-btn
      >
    </template>

    <template v-slot:activator="{ on }">
      <v-btn color="primary" v-on="on">
        <v-icon>mdi-text-search-variant</v-icon>
      </v-btn>
    </template>

    <div v-if="!modeSelection">
      <v-row class="ma-0">
        <v-col cols="5">
          <v-row class="ma-0" justify="center">
            <span class="text-center mt-4 mb-6"
              >Not sure exactly what routes to clear? Use a template to help you
              select the right one.</span
            >
          </v-row>
          <v-row class="ma-0" justify="center">
            <v-btn color="primary" @click="modeSelection = 'template'"
              >Templates
              <v-icon class="ml-1" small>mdi-arrow-right-thin</v-icon>
            </v-btn>
          </v-row>
        </v-col>
        <v-col cols="2" class="px-8">
          <v-divider vertical />
        </v-col>
        <v-col cols="5">
          <v-row class="ma-0" justify="center">
            <span class="text-center mt-4 mb-6"
              >Already know exactly what routes you want to clear? You can do so
              manually here.</span
            >
          </v-row>
          <v-row class="ma-0" justify="center">
            <v-btn color="primary" @click="modeSelection = 'manual'"
              >Manual
              <v-icon class="ml-1" small>mdi-arrow-right-thin</v-icon>
            </v-btn>
          </v-row>
        </v-col>
      </v-row>
    </div>

    <div v-if="modeSelection === 'template'">
      <v-row class="ma-0" justify="center">
        <span>1. Select a type to see the relevant templates</span>
      </v-row>
      <v-row class="ma-0" justify="center">
        <v-col cols="3" class="pa-0"></v-col>
        <v-col cols="6" class="pa-0">
          <v-select
            dense
            placeholder="Template Type"
            :items="allCacheRouteTypes"
            v-model="selectedTemplateType"
            clearable
            outlined
            class="pt-2"
            hide-details
            color="info"
          />
        </v-col>
        <v-col cols="3" class="pa-0"></v-col>
      </v-row>
      <v-row
        class="ma-0 mt-4 mb-2"
        justify="center"
        v-if="selectedTemplateType"
      >
        <span>2. Select a template to set up the clearing process</span>
      </v-row>
      <v-row class="ma-0" justify="center">
        <v-chip
          v-for="(template, idx) in individualClearTemplates.filter(
            template => template.type === selectedTemplateType
          )"
          :key="idx"
          class="mr-1 mt-1"
          color="info"
          @click="selectedTemplate = template"
          >{{ template.name }}</v-chip
        >
      </v-row>
      <v-row v-if="selectedTemplate" class="ma-0 mt-4" justify="center">{{
        selectedLevel === 'exact'
          ? `3. ${
              selectedTemplate.routePieces
                .map(piece => piece.type)
                .includes('param')
                ? 'Complete the route parameters. '
                : ''
            }This exact route will be cleared:`
          : '3. All route(s) starting as such will be cleared:'
      }}</v-row>
      <v-row
        v-if="selectedTemplate"
        class="ma-0 mt-4"
        justify="center"
        align="center"
      >
        <div v-for="(piece, idx) in selectedTemplate.routePieces" :key="idx">
          <span
            v-if="piece.type === 'separator' || piece.type === 'static'"
            class="oare-title"
            >{{ piece.label }}</span
          >
          <v-text-field
            v-if="piece.type === 'param'"
            :placeholder="piece.label"
            outlined
            dense
            hide-details
            v-model="piece.value"
            color="info"
          />
        </div>
      </v-row>
    </div>
    <div v-else-if="modeSelection === 'manual'">
      <v-text-field
        v-model="routeToClear"
        outlined
        label="Backend Route URL To Clear"
        placeholder="Ex: /words/A"
        hide-details
        class="mt-6"
      />
      <span> <b>Note: </b>Do not include the API prefix <i>/api/v2</i> </span>
      <v-radio-group v-model="selectedLevel" hide-details class="mb-2">
        <v-radio label="Exact" :value="'exact'" />
        <v-radio label="Starts With" :value="'startsWith'" />
      </v-radio-group>
    </div>
    <v-row
      v-show="modeSelection && routeToClear !== '/'"
      class="ma-0 mt-6"
      justify="center"
    >
      <span
        :class="{
          'red--text': numMatchingKeys === 0,
          'primary--text': numMatchingKeys !== 0,
        }"
      >
        <b>{{ numMatchingKeys }}</b> Matching Cache Entr{{
          numMatchingKeys !== 1 ? 'ies' : 'y'
        }}
        Across All Cache Server Instances</span
      >
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from '@vue/composition-api';
import sl from '@/serviceLocator';

type CacheRouteType =
  | 'Collections'
  | 'Text Epigraphies'
  | 'Words'
  | 'Names'
  | 'Places'
  | 'Signs'
  | 'Properties Taxonomy Tree'
  | 'Dictionary'
  | 'Page Content'
  | 'Bibliography'
  | 'Seal'
  | 'Persons'
  | 'Periods';

interface RoutePiece {
  type: 'static' | 'param' | 'separator';
  label: string;
  value?: string;
}

interface IndividualClearTemplate {
  name: string;
  routePieces: RoutePiece[];
  level: 'exact' | 'startsWith';
  type: CacheRouteType;
}

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  setup(_props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');

    const individualClearLoading = ref(false);
    const routeToClear = ref('/');

    const selectedLevel = ref<'exact' | 'startsWith'>('exact');
    const clearRoute = async () => {
      try {
        individualClearLoading.value = true;
        await server.clearCacheRoute(routeToClear.value, selectedLevel.value);
        actions.showSnackbar('Successfully cleared specified cache route(s).');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error clearing individual cache route(s). Please try again.',
          err as Error
        );
      } finally {
        individualClearLoading.value = false;
        emit('input', false);
        routeToClear.value = '/';
        selectedLevel.value = 'exact';
      }
    };

    const numMatchingKeys = ref(0);
    const getMatchingKeys = async () => {
      try {
        numMatchingKeys.value = await server.getNumKeys(
          routeToClear.value,
          selectedLevel.value
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error getting matching keys. Please try again.',
          err as Error
        );
      }
    };

    watch([routeToClear, selectedLevel], _.debounce(getMatchingKeys, 200));

    const allCacheRouteTypes = ref<CacheRouteType[]>([
      'Collections',
      'Text Epigraphies',
      'Words',
      'Names',
      'Places',
      'Signs',
      'Properties Taxonomy Tree',
      'Dictionary',
      'Page Content',
      'Bibliography',
      'Seal',
      'Persons',
      'Periods',
    ]);

    const individualClearTemplates = ref<IndividualClearTemplate[]>([
      {
        name: 'Collections List',
        routePieces: [
          { type: 'separator', label: '/' },
          { type: 'static', label: 'collections' },
        ],
        level: 'exact',
        type: 'Collections',
      },
      {
        name: 'Collection Texts - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'collections',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Collections',
      },
      {
        name: 'Collection Texts - Specific',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'collections',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Collection UUID',
          },
        ],
        level: 'exact',
        type: 'Collections',
      },
      {
        name: 'Dictionary Words - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'dictionary',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Dictionary',
      },
      {
        name: 'Dictionary Word - Specific',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'dictionary',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Word UUID',
          },
        ],
        level: 'exact',
        type: 'Dictionary',
      },
      {
        name: 'Properties Taxonomy Tree',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'properties_taxonomy_tree',
          },
        ],
        level: 'exact',
        type: 'Properties Taxonomy Tree',
      },
      {
        name: 'Words Pages - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'words',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Words',
      },
      {
        name: 'Words Page - Specific',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'words',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Letter',
          },
        ],
        level: 'exact',
        type: 'Words',
      },
      {
        name: 'Names Pages - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'names',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Names',
      },
      {
        name: 'Names Page - Specific',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'names',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Letter',
          },
        ],
        level: 'exact',
        type: 'Names',
      },
      {
        name: 'Places Pages - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'places',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Places',
      },
      {
        name: 'Places Page - Specific',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'places',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Letter',
          },
        ],
        level: 'exact',
        type: 'Places',
      },
      {
        name: 'Page Content',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'page_content',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Route Name',
          },
        ],
        level: 'exact',
        type: 'Page Content',
      },
      {
        name: 'Sign List',
        type: 'Signs',
        level: 'startsWith',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'signList',
          },
        ],
      },
      {
        name: 'Sign Readings',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'sign_reading',
          },
        ],
        level: 'startsWith',
        type: 'Signs',
      },
      {
        name: 'Text Epigraphies - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text_epigraphies',
          },
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Text Epigraphies',
      },
      {
        name: 'Text Epigraphies - Specfic',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text_epigraphies',
          },
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Text UUID',
          },
        ],
        level: 'startsWith',
        type: 'Text Epigraphies',
      },
      {
        name: 'Text Source Files - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text_epigraphies',
          },
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text_source',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Text Epigraphies',
      },
      {
        name: 'Text Source Files - Specific',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text_epigraphies',
          },
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'text_source',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Text UUID',
          },
        ],
        level: 'startsWith',
        type: 'Text Epigraphies',
      },
      {
        name: 'Bibliographies List',
        level: 'startsWith',
        type: 'Bibliography',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'bibliographies',
          },
        ],
      },
      {
        name: 'Bibliographies - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'bibliography',
          },
          {
            type: 'separator',
            label: '/',
          },
        ],
        level: 'startsWith',
        type: 'Bibliography',
      },
      {
        name: 'Bibliography - Specific',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'bibliography',
          },
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'param',
            label: 'Bibliography UUID',
          },
        ],
        level: 'exact',
        type: 'Bibliography',
      },
      {
        name: 'Seals - All',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'seals',
          },
          { type: 'separator', label: '/' },
        ],
        level: 'startsWith',
        type: 'Seal',
      },
      {
        name: 'Seals - Specific',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'seals',
          },
          { type: 'separator', label: '/' },
          {
            type: 'param',
            label: 'Seal UUID',
          },
        ],
        level: 'exact',
        type: 'Seal',
      },
      {
        name: 'Seals List',
        routePieces: [
          { type: 'separator', label: '/' },
          {
            type: 'static',
            label: 'seals',
          },
        ],
        level: 'exact',
        type: 'Seal',
      },
      {
        name: 'Persons List - All',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'persons',
          },
          {
            type: 'separator',
            label: '/',
          },
        ],
        level: 'startsWith',
        type: 'Persons',
      },
      {
        name: 'Persons List - Specific',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'persons',
          },
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'param',
            label: 'Letter',
          },
        ],
        level: 'exact',
        type: 'Persons',
      },
      {
        name: 'Individual Persons - All',
        type: 'Persons',
        level: 'startsWith',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'person',
          },
          {
            type: 'separator',
            label: '/',
          },
        ],
      },
      {
        name: 'Individual Person - Specific',
        type: 'Persons',
        level: 'exact',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'person',
          },
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'param',
            label: 'Person UUID',
          },
        ],
      },
      {
        name: 'Periods List',
        level: 'exact',
        type: 'Periods',
        routePieces: [
          {
            type: 'separator',
            label: '/',
          },
          {
            type: 'static',
            label: 'periods',
          },
        ],
      },
    ]);

    const selectedTemplate = ref<IndividualClearTemplate>();

    const modeSelection = ref<'template' | 'manual'>();

    watch(
      selectedTemplate,
      () => {
        if (selectedTemplate.value) {
          selectedLevel.value = selectedTemplate.value.level;

          const mergedRoutePieces: string[] = [];
          selectedTemplate.value.routePieces.forEach(piece => {
            if (piece.type === 'separator' || piece.type === 'static') {
              mergedRoutePieces.push(piece.label);
            } else {
              mergedRoutePieces.push(piece.value || '');
            }
          });

          routeToClear.value = mergedRoutePieces.join('');
        } else {
          routeToClear.value = '/';
          selectedLevel.value = 'exact';
        }
      },
      { deep: true }
    );

    const handleBack = () => {
      selectedTemplate.value = undefined;
      routeToClear.value = '/';
      selectedLevel.value = 'exact';
      selectedTemplateType.value = undefined;
      modeSelection.value = undefined;
    };

    const title = computed(() => {
      switch (modeSelection.value) {
        case 'template':
          return 'Clear Cache - Templates';
        case 'manual':
          return 'Clear Cache - Manual';
        default:
          return 'Clear Individual Cache Entry';
      }
    });

    const selectedTemplateType = ref<CacheRouteType>();

    watch(selectedTemplateType, () => {
      selectedTemplate.value = undefined;
      routeToClear.value = '/';
      selectedLevel.value = 'exact';
    });

    return {
      clearRoute,
      individualClearLoading,
      routeToClear,
      selectedLevel,
      numMatchingKeys,
      individualClearTemplates,
      modeSelection,
      selectedTemplate,
      handleBack,
      allCacheRouteTypes,
      title,
      selectedTemplateType,
    };
  },
});
</script>
