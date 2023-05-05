<template>
  <v-expansion-panel :readonly="variable.values.length === 0 || ignored">
    <v-expansion-panel-header
      @keyup.space.prevent
      :hide-actions="variable.values.length === 0"
    >
      <template #default="{ open }">
        <v-row class="ma-0" align="center">
          <mark
            v-if="nodesToHighlight.includes(variable.hierarchy.uuid)"
            class="mx-1"
          >
            {{ variable.name }}
          </mark>
          <span v-else class="mx-1">
            {{ variable.name }}
          </span>
          <span v-if="variable.abbreviation" class="text--disabled mx-1">
            <span> ({{ variable.abbreviation }})</span>
          </span>

          <property-info
            v-if="readonly"
            :propertyItem="variable"
            class="mx-1"
          />

          <b
            v-if="
              !readonly &&
              open &&
              variable.type === 'nominal' &&
              variable.hierarchy.custom === 1 &&
              !overrideCustom
            "
            class="text--disabled mx-1"
            >Only one selection permitted</b
          >

          <span
            v-show="!open && selectionDisplay && !readonly"
            class="info--text mx-1"
          >
            <v-icon v-if="variable.type === 'munsell'" :color="selectionDisplay"
              >mdi-circle</v-icon
            >
            <span v-else>{{ selectionDisplay }}</span>
          </span>

          <v-btn
            v-if="showUuid"
            text
            @click="copyUuid(variable.hierarchy.uuid)"
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
            @click="copyUuid(variable.uuid)"
            @click.native.stop
            small
            color="info"
            class="mx-1 px-1"
          >
            <span>
              <v-icon x-small class="mr-1">mdi-content-copy</v-icon>
              Copy Variable UUID
            </span>
          </v-btn>

          <v-spacer />

          <span
            v-if="
              (variable.type === 'integral' || variable.type === 'ordinal') &&
              !readonly
            "
            class="mr-2"
          >
            <v-text-field
              v-model="integralOrdinalInput"
              hide-details="auto"
              dense
              outlined
              label="Integer Value"
              placeholder="Ex: 1"
              @click.stop
              :rules="[integralOrdinalRule]"
            />
          </span>

          <span
            v-else-if="variable.type === 'logical' && !readonly"
            class="mr-2"
          >
            <v-row class="ma-0" align="center">
              <v-checkbox
                v-model="applyLogical"
                dense
                hide-details
                label="Apply?"
                class="mt-0 pt-0 mr-2"
                @click.stop
              />
              <v-switch
                v-model="logicalInput"
                dense
                hide-details
                @click.stop
                :disabled="!applyLogical"
                class="mt-0 pt-0 mx-1"
                :label="applyLogical ? (logicalInput ? 'True' : 'False') : ''"
              />
            </v-row>
          </span>

          <span
            v-else-if="variable.type === 'decimal' && !readonly"
            class="mr-2"
          >
            <v-text-field
              v-model="decimalInput"
              hide-details="auto"
              dense
              outlined
              label="Decimal Value"
              placeholder="Ex: 1.1"
              @click.stop
              :rules="[decimalRule]"
            />
          </span>

          <span
            v-else-if="variable.type === 'alphanumeric' && !readonly"
            class="mr-2"
          >
            <v-text-field
              v-model="alphanumericInput"
              hide-details
              dense
              outlined
              label="Enter text here"
              @click.stop
            />
          </span>

          <span
            v-else-if="variable.type === 'munsell' && !readonly"
            class="mr-2"
          >
            <v-text-field
              v-model="munsellInput"
              hide-details="auto"
              dense
              outlined
              label="Munsell Color"
              placeholder="Ex: 2.3YR 6.7/4.22"
              @click.stop
              :rules="[munsellRule]"
            />
          </span>

          <span
            v-else-if="variable.type === 'calendrical' && !readonly"
            class="mr-1"
          >
            <v-row class="ma-0">
              <v-text-field
                v-model="calendricalYearInput"
                hide-details="auto"
                dense
                outlined
                label="Year"
                placeholder="YYYY"
                @click.stop
                class="mx-1"
                :rules="[calendricalYearRule]"
              />
              <v-text-field
                v-model="calendricalMonthInput"
                hide-details="auto"
                dense
                outlined
                label="Month"
                placeholder="MM"
                @click.stop
                class="mx-1"
                :rules="[calendricalMonthRule]"
                :disabled="
                  !calendricalYearInput ||
                  !calendricalYearRule(calendricalYearInput, true)
                "
              />
              <v-text-field
                v-model="calendricalDayInput"
                hide-details="auto"
                dense
                outlined
                label="Day"
                placeholder="DD"
                @click.stop
                class="mx-1"
                :rules="[calendricalDayRule]"
                :disabled="
                  !calendricalYearInput ||
                  !calendricalYearRule(calendricalYearInput, true) ||
                  !calendricalMonthInput ||
                  !calendricalMonthRule(calendricalMonthInput, true)
                "
              />
            </v-row>
          </span>

          <span v-else-if="variable.type === 'link' && !readonly" class="mr-2">
            <v-autocomplete
              :label="linkLabel(variable.tableReference)"
              outlined
              dense
              hide-details
              hide-no-data
              placeholder="Start typing to search"
              v-model="linkInput"
              :items="linkItems"
              :loading="linkLoading"
              :search-input.sync="linkSearch"
              item-text="objectDisplay"
              item-value="objectUuid"
              return-object
              @click.native.stop
              no-filter
              clearable
            >
              <template #item="{ item }">
                <v-list-item-title>
                  <span>{{ item.objectDisplay }}</span>
                  <b v-if="item.objectDisplaySuffix" class="ml-1"
                    >({{ item.objectDisplaySuffix }})</b
                  >
                </v-list-item-title>
              </template>
            </v-autocomplete>
          </span>

          <v-checkbox
            v-if="appliedProperties.length === 0 && !readonly && showValidation"
            label="Ignore"
            hide-details
            class="mt-0 pt-0 mr-3 test-ignore"
            dense
            v-model="ignored"
            @click.stop
          />

          <v-icon
            v-if="showCheck && !readonly && showValidation"
            color="green"
            class="mx-1"
            >mdi-check-circle-outline</v-icon
          >
          <v-menu
            v-else-if="!readonly && showValidation"
            offset-y
            open-on-hover
          >
            <template #activator="{ on, attrs }">
              <v-icon color="orange" v-bind="attrs" v-on="on" class="mx-1"
                >mdi-information-outline
              </v-icon>
            </template>
            <v-card class="pa-2">This subtree has not been completed</v-card>
          </v-menu>
          <span
            v-if="!readonly"
            :class="{
              'mx-1': variable.values.length !== 0,
              'ml-1 mr-7': variable.values.length === 0,
            }"
          />
        </v-row>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content
      v-if="variable.values.length > 0"
      :eager="!!existingProperties || !!valuesToPreselect"
    >
      <v-expansion-panels flat v-model="openPanels" focusable>
        <property-value-display
          v-for="(value, idx) in valuesToDisplay"
          :key="value.hierarchy.uuid"
          :value="value"
          :showUuid="showUuid"
          :nodesToHighlight="nodesToHighlight"
          :openSearchResults="openSearchResults"
          :parentVariable="variable"
          @update-properties="updateProperties($event, value)"
          @value-selected="setUpAutoOpen"
          @completed="handleCompleted(value.hierarchy.uuid, $event)"
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
  watch,
  ref,
  computed,
  onMounted,
} from '@vue/composition-api';
import {
  AppliedProperty,
  ItemPropertyRow,
  LinkItem,
  PreselectionProperty,
  PropertyValue,
  PropertyVariable,
  TableReferenceType,
} from '@oare/types';
import PropertyValueDisplay from './PropertyValueDisplay.vue';
import sl from '@/serviceLocator';
import * as munsell from 'munsell';
import PropertyInfo from './PropertyInfo.vue';

export default defineComponent({
  name: 'PropertyVariable',
  props: {
    variable: {
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
    PropertyValueDisplay,
    PropertyInfo,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');

    const copyUuid = (uuid: string) => {
      navigator.clipboard.writeText(uuid);
      actions.showSnackbar('Copied Successfully');
    };

    const openPanels = ref<number>();

    watch(
      () => props.openSearchResults,
      () => {
        if (props.openSearchResults) {
          props.variable.values.forEach((value, idx) => {
            if (
              props.nodesToHighlight.includes(value.hierarchy.uuid) &&
              value.variables.length > 0
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

    const appliedProperties = ref<AppliedProperty[]>([]);
    watch(appliedProperties, () => {
      emit(
        'update-properties',
        appliedProperties.value.map(p => ({
          ...p,
          sourceUuid: props.variable.hierarchy.uuid,
        }))
      );
    });
    const updateProperties = (
      childProperties: AppliedProperty[],
      value: PropertyValue
    ) => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== value.hierarchy.uuid
      );
      appliedProperties.value.push(...childProperties);
    };

    const valuesToDisplay = computed(() => {
      const relevantProperties = appliedProperties.value.filter(
        p =>
          p.variableRow.hierarchy.uuid === props.variable.hierarchy.uuid &&
          p.valueRow
      );
      if (
        props.variable.hierarchy.custom === 1 &&
        relevantProperties.length > 0 &&
        !props.overrideCustom
      ) {
        const valueHierarchyUuids = relevantProperties.map(
          p => p.valueRow!.hierarchy.uuid
        );
        return props.variable.values.filter(val =>
          valueHierarchyUuids.includes(val.hierarchy.uuid)
        );
      }
      return props.variable.values;
    });
    watch(valuesToDisplay, () => {
      if (
        valuesToDisplay.value.length === 1 &&
        props.variable.hierarchy.custom === 1 &&
        !props.overrideCustom
      ) {
        openPanels.value = 0;
      }
    });

    const setUpAutoOpen = () => {
      if (props.variable.hierarchy.custom === 1 && !props.overrideCustom) {
        emit('auto-open-next');
      }
    };

    const selectionDisplay = computed(() => {
      if (
        props.variable.type !== 'nominal' &&
        props.variable.type !== 'munsell'
      ) {
        return '';
      }
      const relevantProperties = appliedProperties.value.filter(
        p => p.variableRow.hierarchy.uuid === props.variable.hierarchy.uuid
      );
      if (relevantProperties.length === 0) {
        return '';
      }
      return relevantProperties
        .map(p => {
          if (p.variableRow.type === 'nominal' && p.valueRow) {
            return p.valueRow.name;
          }
          if (p.variableRow.type === 'munsell' && p.value) {
            return munsell.munsellToHex(p.value as string);
          }
          return '';
        })
        .join(', ');
    });

    const integralOrdinalInput = ref<string>();
    watch(integralOrdinalInput, () => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== props.variable.hierarchy.uuid
      );
      if (
        integralOrdinalInput.value &&
        integralOrdinalRule(integralOrdinalInput.value, true)
      ) {
        appliedProperties.value.push({
          variableRow: props.variable,
          valueRow: null,
          value: integralOrdinalInput.value,
          objectUuid: null,
          objectDisplay: null,
          sourceUuid: props.variable.hierarchy.uuid,
        });
      }
    });
    const integralOrdinalRule = (input: string, errorAsBoolean = false) => {
      if (!input) {
        return true;
      }
      const isInteger = _.isInteger(Number(input));
      if (!isInteger) {
        return errorAsBoolean ? false : 'Must be an integer';
      }
      return true;
    };

    const applyLogical = ref(false);
    const logicalInput = ref<boolean>();
    watch(applyLogical, () => {
      if (applyLogical.value) {
        logicalInput.value = true;
      } else {
        logicalInput.value = undefined;
      }
    });
    watch(logicalInput, () => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== props.variable.hierarchy.uuid
      );
      if (logicalInput.value !== undefined) {
        appliedProperties.value.push({
          variableRow: props.variable,
          valueRow: null,
          value: logicalInput.value,
          objectUuid: null,
          objectDisplay: null,
          sourceUuid: props.variable.hierarchy.uuid,
        });
      }
    });

    const decimalInput = ref<string>();
    watch(decimalInput, () => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== props.variable.hierarchy.uuid
      );
      if (decimalInput.value && decimalRule(decimalInput.value, true)) {
        appliedProperties.value.push({
          variableRow: props.variable,
          valueRow: null,
          value: decimalInput.value,
          objectUuid: null,
          objectDisplay: null,
          sourceUuid: props.variable.hierarchy.uuid,
        });
      }
    });
    const decimalRule = (input: string, errorAsBoolean = false) => {
      if (!input) {
        return true;
      }
      const numberInput = Number(input);
      if (Number.isNaN(numberInput)) {
        return errorAsBoolean ? false : 'Must be a number';
      }
      return true;
    };

    const alphanumericInput = ref<string>();
    watch(alphanumericInput, () => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== props.variable.hierarchy.uuid
      );
      if (alphanumericInput.value) {
        appliedProperties.value.push({
          variableRow: props.variable,
          valueRow: null,
          value: alphanumericInput.value,
          objectUuid: null,
          objectDisplay: null,
          sourceUuid: props.variable.hierarchy.uuid,
        });
      }
    });

    const munsellInput = ref<string>();
    watch(munsellInput, () => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== props.variable.hierarchy.uuid
      );
      if (munsellInput.value && munsellRule(munsellInput.value, true)) {
        appliedProperties.value.push({
          variableRow: props.variable,
          valueRow: null,
          value: munsellInput.value,
          objectUuid: null,
          objectDisplay: null,
          sourceUuid: props.variable.hierarchy.uuid,
        });
      }
    });
    const munsellRule = (input: string, errorAsBoolean = false) => {
      if (!input) {
        return true;
      }
      try {
        munsell.munsellToRgb(input);
      } catch (e) {
        return errorAsBoolean ? false : 'Must be a valid Munsell color';
      }
      return true;
    };

    const calendricalYearInput = ref<string>();
    const calendricalMonthInput = ref<string>();
    const calendricalDayInput = ref<string>();
    watch(
      [calendricalYearInput, calendricalMonthInput, calendricalDayInput],
      () => {
        appliedProperties.value = appliedProperties.value.filter(
          p => p.sourceUuid !== props.variable.hierarchy.uuid
        );
        if (
          calendricalYearInput.value &&
          calendricalYearRule(calendricalYearInput.value, true)
        ) {
          let displayValue = `${calendricalYearInput.value}`;
          if (
            calendricalMonthInput.value &&
            calendricalMonthRule(calendricalMonthInput.value, true)
          ) {
            displayValue += `-${calendricalMonthInput.value}`;
            if (
              calendricalDayInput.value &&
              calendricalDayRule(calendricalDayInput.value, true)
            ) {
              displayValue += `-${calendricalDayInput.value}`;
            }
          }

          appliedProperties.value.push({
            variableRow: props.variable,
            valueRow: null,
            value: displayValue,
            objectUuid: null,
            objectDisplay: null,
            sourceUuid: props.variable.hierarchy.uuid,
          });
        }
      }
    );
    const calendricalYearRule = (input: string, errorAsBoolean = false) => {
      if (!input) {
        if (calendricalMonthInput.value || calendricalDayInput.value) {
          return errorAsBoolean
            ? false
            : 'A valid year is required when a month is specified';
        }
        return true;
      }
      const isInteger = _.isInteger(Number(input));
      if (!isInteger || input.length !== 4) {
        return errorAsBoolean ? false : 'Must be a valid year (YYYY)';
      }
      return true;
    };
    const calendricalMonthRule = (input: string, errorAsBoolean = false) => {
      if (!input) {
        if (calendricalDayInput.value) {
          return errorAsBoolean
            ? false
            : 'A valid month is required when a day is specified';
        }
        return true;
      }
      const inputAsNumber = Number(input);
      const isInteger = _.isInteger(inputAsNumber);
      if (
        !isInteger ||
        inputAsNumber < 1 ||
        inputAsNumber > 12 ||
        input.length !== 2
      ) {
        return errorAsBoolean ? false : 'Must be a valid month (MM)';
      }
      return true;
    };
    const calendricalDayRule = (input: string, errorAsBoolean = false) => {
      if (!input) {
        return true;
      }
      const inputAsNumber = Number(input);
      const isInteger = _.isInteger(inputAsNumber);
      if (
        !isInteger ||
        inputAsNumber < 1 ||
        inputAsNumber > 31 ||
        input.length !== 2
      ) {
        return errorAsBoolean ? false : 'Must be a valid day (DD)';
      }
      return true;
    };

    const linkInput = ref<LinkItem>();
    const linkLoading = ref(false);
    const linkSearch = ref<string>();
    const linkItems = ref<LinkItem[]>([]);
    const linkLabel = (tableReference: TableReferenceType | null) => {
      if (!tableReference) {
        return 'Link Unavailable';
      }
      return tableReference.split(/[_?]/g).map(_.capitalize).join(' ');
    };
    watch(
      linkSearch,
      _.debounce(async () => {
        try {
          linkLoading.value = true;
          if (!linkSearch.value || !props.variable.tableReference) {
            linkItems.value = [];
            linkInput.value = undefined;
            return;
          }
          if (linkInput.value) {
            return;
          }
          linkItems.value = await server.searchLinkProperties(
            linkSearch.value,
            props.variable.tableReference
          );
        } catch (err) {
          actions.showErrorSnackbar(
            'Error loading link options. Please try again.',
            err as Error
          );
        } finally {
          linkLoading.value = false;
        }
      }, 500)
    );
    watch(linkInput, () => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== props.variable.hierarchy.uuid
      );
      if (linkInput.value) {
        appliedProperties.value.push({
          variableRow: props.variable,
          valueRow: null,
          value: null,
          objectUuid: linkInput.value.objectUuid,
          objectDisplay: linkInput.value.objectDisplay,
          sourceUuid: props.variable.hierarchy.uuid,
        });
      }
    });

    const showCheck = computed(() => {
      if (ignored.value) {
        return true;
      }

      const numSubtrees = props.variable.values.filter(
        val => val.variables.length > 0
      ).length;

      if (numSubtrees === 0) {
        const variablePropertyIsApplied =
          appliedProperties.value.filter(
            p => p.variableRow.hierarchy.uuid === props.variable.hierarchy.uuid
          ).length > 0;
        return variablePropertyIsApplied;
      } else if (
        props.variable.hierarchy.custom === 1 &&
        !props.overrideCustom
      ) {
        const variableProperties = appliedProperties.value.filter(
          p => p.variableRow.hierarchy.uuid === props.variable.hierarchy.uuid
        );
        if (variableProperties.length === 1) {
          const variableProperty = variableProperties[0];
          if (variableProperty.valueRow!.variables.length === 0) {
            return true;
          } else {
            return completedSubtrees.value.includes(
              variableProperty.valueRow!.hierarchy.uuid
            );
          }
        } else {
          return false;
        }
      }
      return numSubtrees === completedSubtrees.value.length;
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

    onMounted(async () => {
      if (props.existingProperties) {
        const relevantProperties = props.existingProperties.filter(p => {
          const parentProperty = props.existingProperties!.find(
            exis => exis.uuid === p.parentUuid
          );
          const hasValidParentRelationship = parentProperty
            ? props.variable.hierarchy.objectParentUuid ===
              parentProperty.valueUuid
            : true;

          const hasValidGrandparentRelationship = parentProperty
            ? props.variable.hierarchy.objectGrandparentUuid ===
              parentProperty.variableUuid
            : true;
          return (
            props.variable.type !== 'nominal' &&
            p.level === props.variable.level &&
            p.variableUuid === props.variable.uuid &&
            hasValidParentRelationship &&
            hasValidGrandparentRelationship
          );
        });
        if (relevantProperties.length !== 1) {
          return;
        }
        const relevantProperty = relevantProperties[0];

        if (
          props.variable.type === 'integral' ||
          props.variable.type === 'ordinal'
        ) {
          integralOrdinalInput.value = relevantProperty.value;
        } else if (props.variable.type === 'logical') {
          applyLogical.value = true;
          logicalInput.value = !!relevantProperty.value;
        } else if (props.variable.type === 'decimal') {
          decimalInput.value = relevantProperty.value;
        } else if (props.variable.type === 'alphanumeric') {
          alphanumericInput.value = relevantProperty.value;
        } else if (props.variable.type === 'munsell') {
          munsellInput.value = relevantProperty.value;
        } else if (props.variable.type === 'calendrical') {
          const splitValue = relevantProperty.value.split('-');
          calendricalYearInput.value = splitValue[0];
          if (splitValue.length > 1) {
            calendricalMonthInput.value = splitValue[1];
          }
          if (splitValue.length > 2) {
            calendricalDayInput.value = splitValue[2];
          }
        } else if (
          props.variable.type === 'link' &&
          props.variable.tableReference
        ) {
          linkSearch.value = relevantProperty.objectUuid;
          linkItems.value = await server.searchLinkProperties(
            linkSearch.value,
            props.variable.tableReference
          );
          linkInput.value = {
            objectUuid: relevantProperty.objectUuid,
            objectDisplay: linkItems.value[0].objectDisplay,
          };
        }
      }
    });

    return {
      copyUuid,
      openPanels,
      appliedProperties,
      updateProperties,
      setUpAutoOpen,
      selectionDisplay,
      integralOrdinalRule,
      integralOrdinalInput,
      applyLogical,
      logicalInput,
      decimalInput,
      decimalRule,
      alphanumericInput,
      munsellInput,
      munsellRule,
      calendricalYearInput,
      calendricalMonthInput,
      calendricalDayInput,
      calendricalYearRule,
      calendricalMonthRule,
      calendricalDayRule,
      showCheck,
      completedSubtrees,
      ignored,
      handleCompleted,
      linkInput,
      linkLoading,
      linkSearch,
      linkItems,
      linkLabel,
      valuesToDisplay,
      handleIgnored,
    };
  },
});
</script>