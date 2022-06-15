<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Insert Parent Discourse"
    closeOnSubmit
    width="1000"
    @submit="submit"
    :submitDisabled="submitDisabled"
    :submitLoading="submitLoading"
  >
    <v-row>
      <v-col cols="6">
        <h3>Select Unit Type</h3>
        <v-select
          dense
          label="Type"
          :items="discourseTypeOptions"
          v-model="discourseType"
          class="pt-2"
          outlined
          hide-details
        />
      </v-col>
      <v-col
        cols="6"
        v-if="discourseType === 'Paragraph' || discourseType === 'Sentence'"
      >
        <h3>
          {{
            discourseType === 'Paragraph'
              ? 'Enter Paragraph Label'
              : 'Enter Sentence Translation'
          }}
        </h3>
        <v-text-field
          dense
          :label="discourseType === 'Paragraph' ? 'Label' : 'Translation'"
          v-model="newContent"
          class="pt-2 mb-2"
          outlined
          hide-details
        />
        <span v-if="discourseType === 'Paragraph'"
          >Examples: 'Reporting on assets and claims', 'Questioning practices',
          'Reporting on a previous request', 'Requesting updates', 'Epistolary
          Formula'</span
        >
      </v-col>
    </v-row>
    <v-row v-if="discourseType && startingPoint">
      <v-col>
        <h3 class="mb-2">Select Properties</h3>
        <v-row class="px-3 pb-4">
          <span v-if="properties.length === 0"
            >No additional properties selected</span
          >
          <v-chip
            v-else
            v-for="(property, idx) in properties"
            :key="idx"
            class="my-1 mr-2"
            color="info"
            outlined
            :title="propertyText(property)"
            >{{ propertyText(property) }}
          </v-chip>
        </v-row>
        <v-btn @click="selectPropertiesDialog = true" color="primary">
          Select Additional Properties
        </v-btn>
        <oare-dialog
          v-model="selectPropertiesDialog"
          title="Additional Text Properties"
          :width="1000"
          submitText="OK"
          closeOnSubmit
          eager
          :showCancel="false"
          :submitDisabled="!formComplete"
        >
          <add-properties
            :key="startingPoint"
            :startingUuid="startingPoint.startingUuid"
            :requiredNodeValueName="startingPoint.requiredNodeValueName"
            @export-properties="setProperties($event)"
            @form-complete="formComplete = $event"
          />
        </oare-dialog>
      </v-col>
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  ComputedRef,
  PropType,
  inject,
} from '@vue/composition-api';
import AddProperties from '@/components/Properties/AddProperties.vue';
import { DiscourseUnit, ParseTreeProperty } from '@oare/types';
import sl from '@/serviceLocator';
import { EpigraphyReloadKey } from '../../index.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    discourseSelections: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    AddProperties,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const reload = inject(EpigraphyReloadKey);

    const discourseTypeOptions = ref<string[]>([
      'Paragraph',
      'Sentence',
      'Clause',
      'Phrase',
    ]);
    const discourseType = ref('');
    const newContent = ref('');

    const startingPoint: ComputedRef<
      | {
          startingUuid: string;
          requiredNodeValueName: string | undefined;
        }
      | undefined
    > = computed(() => {
      if (
        discourseType.value === 'Paragraph' ||
        discourseType.value === 'Sentence'
      ) {
        return {
          startingUuid: 'ef87ffac-259c-810a-8870-ef7515bb93c2',
          requiredNodeValueName: undefined,
        };
      } else if (discourseType.value === 'Clause') {
        return {
          startingUuid: '0f3b80be-a3d1-d630-ffaa-b86fb2031cab',
          requiredNodeValueName: undefined,
        };
      } else if (discourseType.value === 'Phrase') {
        return {
          startingUuid: 'd4e822ea-7804-f9b6-d54f-9cd9aacf9860',
          requiredNodeValueName: 'Syntactical Analysis',
        };
      }
    });

    const selectPropertiesDialog = ref(false);

    const propertyText = (property: ParseTreeProperty) => {
      return `${property.variable.variableName} - ${property.value.valueName}`;
    };

    const properties = ref<ParseTreeProperty[]>([]);

    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const formComplete = ref(false);

    const submitLoading = ref(false);
    const submit = async () => {
      try {
        submitLoading.value = true;
        await server.insertParentDiscourseRow(
          props.textUuid,
          props.discourseSelections,
          discourseType.value,
          newContent.value,
          properties.value
        );
        actions.showSnackbar(
          `Successfully added new ${discourseType.value.toLowerCase()}`
        );
        reload && reload();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error inserting parent discourse row. Please try again.',
          err as Error
        );
      } finally {
        submitLoading.value = false;
      }
    };

    const submitDisabled = computed(() => {
      if (!discourseType.value) {
        return true;
      } else if (
        discourseType.value === 'Paragraph' ||
        discourseType.value === 'Sentence'
      ) {
        return !newContent.value;
      } else {
        return false;
      }
    });

    return {
      discourseTypeOptions,
      discourseType,
      newContent,
      startingPoint,
      selectPropertiesDialog,
      propertyText,
      properties,
      setProperties,
      formComplete,
      submit,
      submitDisabled,
      submitLoading,
    };
  },
});
</script>
