<template>
  <v-expansion-panel :readonly="value.variables.length === 0 || ignored">
    <v-expansion-panel-header :hide-actions="value.variables.length === 0">
      <template #default>
        <v-row class="ma-0" align="center">
          <v-checkbox
            v-if="!readonly"
            class="mt-0 pt-0"
            hide-details
            v-model="selected"
            :disabled="selectIsDisabled"
            @click.stop
            @change="prepareValueSelected"
          />
          <mark
            v-if="nodesToHighlight.includes(value.hierarchy.uuid)"
            class="mx-1"
          >
            {{ value.name }}
          </mark>
          <span v-else class="mx-1">
            {{ value.name }}
          </span>
          <span v-if="value.abbreviation" class="text--disabled mx-1">
            <span> ({{ value.abbreviation }})</span>
          </span>

          <property-info v-if="readonly" :propertyItem="value" class="mx-1" />

          <v-btn
            v-if="showUuid"
            text
            @click="copyUuid(value.hierarchy.uuid)"
            @click.native.stop
            small
            color="info"
            class="mx-1 px-1"
          >
            <span>
              <v-icon x-small class="mr-1">mdi-content-copy</v-icon>
              Copy Hierarchy UUID
            </span>
          </v-btn>
          <v-btn
            v-if="showUuid"
            text
            @click="copyUuid(value.uuid)"
            @click.native.stop
            small
            color="info"
            class="mx-1 px-1"
          >
            <span>
              <v-icon x-small class="mr-1">mdi-content-copy</v-icon>
              Copy Value UUID
            </span>
          </v-btn>

          <v-spacer />

          <template v-if="!readonly && showValidation">
            <v-checkbox
              v-if="
                appliedProperties.length === 0 && value.variables.length > 0
              "
              label="Ignore"
              hide-details
              class="mt-0 pt-0 mr-3 test-ignore"
              dense
              v-model="ignored"
              @click.stop
            />

            <v-icon v-if="value.variables.length === 0" />
            <v-icon v-else-if="showCheck" color="green" class="mx-1"
              >mdi-check-circle-outline</v-icon
            >
            <v-menu v-else offset-y open-on-hover>
              <template #activator="{ on, attrs }">
                <v-icon color="orange" v-bind="attrs" v-on="on" class="mx-1"
                  >mdi-information-outline
                </v-icon>
              </template>
              <v-card class="pa-2">This subtree has not been completed</v-card>
            </v-menu>
            <span class="mx-1" />
          </template>
        </v-row>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content
      v-if="value.variables.length > 0"
      :eager="!!existingProperties || !!valuesToPreselect"
    >
      <v-expansion-panels flat v-model="openPanels" focusable>
        <component
          :is="propertyVariableComponent"
          v-for="(variable, idx) in variablesToDisplay"
          :key="variable.hierarchy.uuid"
          :variable="variable"
          :showUuid="showUuid"
          :nodesToHighlight="nodesToHighlight"
          :openSearchResults="openSearchResults"
          @update-properties="updateProperties($event, variable)"
          @auto-open-next="autoOpenNext(idx)"
          @completed="handleCompleted(variable.hierarchy.uuid, $event)"
          @ignored="handleIgnored(idx, $event)"
          :readonly="readonly"
          :overrideCustom="overrideCustom"
          :showValidation="showValidation"
          :existingProperties="existingProperties"
          :valuesToPreselect="valuesToPreselect"
        />
      </v-expansion-panels>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  watch,
  ref,
  onMounted,
} from '@vue/composition-api';
import {
  AppliedProperty,
  ItemPropertyRow,
  PreselectionProperty,
  PropertyValue,
  PropertyVariable,
} from '@oare/types';
import sl from '@/serviceLocator';
import PropertyInfo from './PropertyInfo.vue';

export default defineComponent({
  name: 'PropertyValue',
  props: {
    value: {
      type: Object as PropType<PropertyValue>,
      required: true,
    },
    parentVariable: {
      type: Object as PropType<PropertyVariable>,
      required: true,
    },
    showUuid: {
      type: Boolean,
      default: false,
    },
    nodesToHighlight: {
      type: Array as PropType<String[]>,
      default: [],
    },
    openSearchResults: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      required: true,
    },
    overrideCustom: {
      type: Boolean,
      default: false,
    },
    showValidation: {
      type: Boolean,
      default: true,
    },
    existingProperties: {
      type: Array as PropType<ItemPropertyRow[]>,
      required: false,
    },
    valuesToPreselect: {
      type: Array as PropType<PreselectionProperty[]>,
      required: false,
    },
  },
  components: {
    PropertyInfo,
  },
  setup(props, { emit }) {
    // To avoid circular dependencies
    const propertyVariableComponent = computed(
      () => () => import('./PropertyVariableDisplay.vue')
    );

    const actions = sl.get('globalActions');

    const copyUuid = (uuid: string) => {
      navigator.clipboard.writeText(uuid);
      actions.showSnackbar('Copied Successfully');
    };

    const openPanels = ref<number>();

    watch(
      () => props.openSearchResults,
      () => {
        if (props.openSearchResults) {
          props.value.variables.forEach((variable, idx) => {
            if (
              props.nodesToHighlight.includes(variable.hierarchy.uuid) &&
              variable.values.length > 0
            ) {
              openPanels.value = idx;
            }
          });
        } else {
          openPanels.value = undefined;
        }
      },
      { immediate: true }
    );

    const selected = ref(false);
    watch(selected, isSelected => {
      if (isSelected) {
        appliedProperties.value.push({
          variableRow: props.parentVariable,
          valueRow: props.value,
          objectUuid: null,
          objectDisplay: null,
          value: null,
          sourceUuid: props.value.hierarchy.uuid,
        });
      } else {
        appliedProperties.value = appliedProperties.value.filter(
          p =>
            p.sourceUuid !== props.value.hierarchy.uuid ||
            !p.valueRow ||
            p.valueRow.hierarchy.uuid !== props.value.hierarchy.uuid
        );
      }
    });

    const appliedProperties = ref<AppliedProperty[]>([]);
    watch(appliedProperties, () => {
      emit(
        'update-properties',
        appliedProperties.value.map(p => ({
          ...p,
          sourceUuid: props.value.hierarchy.uuid,
        }))
      );
    });
    const updateProperties = (
      childProperties: AppliedProperty[],
      variable: PropertyVariable
    ) => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== variable.hierarchy.uuid
      );
      appliedProperties.value.push(...childProperties);
      if (childProperties.length > 0 && !selected.value) {
        selected.value = true;
      }
    };

    const selectIsDisabled = computed(() => {
      if (selected.value) {
        return appliedProperties.value.length > 1;
      } else {
        return appliedProperties.value.length > 0;
      }
    });

    const autoOpenNext = (idx: number) => {
      openPanels.value = undefined;
      if (idx + 1 < props.value.variables.length) {
        openPanels.value = idx + 1;
      }
    };

    const prepareValueSelected = () => {
      if (props.value.variables.length === 0) {
        emit('value-selected');
      }
    };

    const showCheck = computed(() => {
      if (ignored.value) {
        return true;
      }

      const numSubtrees = props.value.variables.filter(
        variable => variable.values.length > 0
      ).length;
      const numSubvariablesWithoutSubtrees = props.value.variables.filter(
        variable => variable.values.length === 0 && variable.type !== 'serial'
      ).length;
      return (
        numSubtrees + numSubvariablesWithoutSubtrees ===
        completedSubtrees.value.length
      );
    });
    const ignored = ref(false);

    const completedSubtrees = ref<string[]>([]);

    watch(showCheck, isComplete => {
      emit('completed', isComplete);
    });
    watch(ignored, isIgnored => {
      emit('ignored', isIgnored);
    });

    const handleCompleted = (uuid: string, isCompleted: boolean) => {
      if (isCompleted) {
        completedSubtrees.value.push(uuid);
      } else {
        completedSubtrees.value = completedSubtrees.value.filter(
          u => u !== uuid
        );
      }
    };
    const handleIgnored = (idx: number, isIgnored: boolean) => {
      if (isIgnored && idx === openPanels.value) {
        openPanels.value = undefined;
      }
    };

    const variablesToDisplay = computed(() => {
      return props.value.variables;
    });

    onMounted(() => {
      if (props.existingProperties) {
        const relevantProperties = props.existingProperties.filter(p => {
          const parentProperty = props.existingProperties!.find(
            exis => exis.uuid === p.parentUuid
          );
          const hasValidParentRelationship = parentProperty
            ? props.parentVariable.hierarchy.objectParentUuid ===
              parentProperty.valueUuid
            : true;

          const hasValidGrandparentRelationship = parentProperty
            ? props.parentVariable.hierarchy.objectGrandparentUuid ===
              parentProperty.variableUuid
            : true;
          return (
            p.level === props.parentVariable.level &&
            p.variableUuid === props.parentVariable.uuid &&
            p.valueUuid === props.value.uuid &&
            hasValidParentRelationship &&
            hasValidGrandparentRelationship
          );
        });
        if (relevantProperties.length !== 1) {
          return;
        }
        selected.value = true;
      }

      if (props.valuesToPreselect) {
        const valuesWithRelevantVariable = props.valuesToPreselect.filter(
          p => p.variableHierarchyUuid === props.parentVariable.hierarchy.uuid
        );
        if (
          valuesWithRelevantVariable
            .map(p => p.valueUuid)
            .includes(props.value.uuid)
        ) {
          selected.value = true;
        }
      }
    });

    return {
      propertyVariableComponent,
      copyUuid,
      openPanels,
      selected,
      updateProperties,
      selectIsDisabled,
      autoOpenNext,
      prepareValueSelected,
      showCheck,
      completedSubtrees,
      ignored,
      handleCompleted,
      appliedProperties,
      handleIgnored,
      variablesToDisplay,
    };
  },
});
</script>