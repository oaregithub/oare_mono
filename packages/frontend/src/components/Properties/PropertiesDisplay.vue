<template>
  <div>
    <v-row
      class="ma-0"
      v-for="(property, index) in propertiesDisplay"
      :key="index"
    >
      <span class="white--text">{{ '_'.repeat(property.level * 3) }}</span>
      <v-chip
        class="my-1"
        color="info"
        outlined
        :title="property"
        :class="`${property.level === 0 ? 'mt-3' : ''}`"
        ><span v-html="property.display" />
        <v-icon v-if="property.color" class="ml-1 mr-n2" :color="property.color"
          >mdi-circle</v-icon
        >
      </v-chip>
    </v-row>
  </div>
</template>

<script lang="ts">
import { AppliedProperty, ItemPropertyRow } from '@oare/types';
import {
  defineComponent,
  PropType,
  computed,
  ComputedRef,
} from '@vue/composition-api';
import { convertAppliedPropsToItemProps } from '@oare/oare';
import * as munsell from 'munsell';

interface PropertyDisplay {
  display: string;
  color?: string;
  level: number;
}

interface AppliedPropertyToItemPropertyBridge {
  itemPropertyRow: ItemPropertyRow;
  appliedProperty: AppliedProperty;
}

export default defineComponent({
  props: {
    properties: {
      type: Array as PropType<AppliedProperty[]>,
      required: true,
    },
  },
  setup(props) {
    const propertiesDisplay: ComputedRef<PropertyDisplay[]> = computed(() => {
      const sortedProperties: AppliedProperty[] = [];
      // Converts to item property rows to allow for hierarchical indentation on display
      const itemProperties = convertAppliedPropsToItemProps(
        props.properties,
        'placeholder'
      );
      const itemPropertiesWithAppliedProperties: AppliedPropertyToItemPropertyBridge[] = itemProperties.map(
        (p, idx) => ({
          itemPropertyRow: p,
          appliedProperty: props.properties[idx],
        })
      );
      const topProperties = itemPropertiesWithAppliedProperties.filter(
        p => !p.itemPropertyRow.parentUuid
      );
      const addChildren = (parent: AppliedPropertyToItemPropertyBridge) => {
        const children = itemPropertiesWithAppliedProperties.filter(
          p => p.itemPropertyRow.parentUuid === parent.itemPropertyRow.uuid
        );
        children.forEach(child => {
          sortedProperties.push(child.appliedProperty);
          addChildren(child);
        });
      };
      topProperties.forEach(p => {
        sortedProperties.push(p.appliedProperty);
        addChildren(p);
      });

      return sortedProperties.map(p => {
        if (p.valueRow) {
          return {
            display: `${p.variableRow.name} - ${p.valueRow.name}`,
            level: p.variableRow.level || 0,
          };
        }
        if (p.objectDisplay) {
          return {
            display: `${p.variableRow.name} - ${p.objectDisplay}`,
            level: p.variableRow.level || 0,
          };
        }
        if (p.value && p.variableRow.type === 'munsell') {
          const hexValue = munsell.munsellToHex(p.value as string);
          return {
            display: `${p.variableRow.name} - `,
            color: hexValue,
            level: p.variableRow.level || 0,
          };
        }
        return {
          display: `${p.variableRow.name} - ${p.value}`,
          level: p.variableRow.level || 0,
        };
      });
    });

    return {
      propertiesDisplay,
    };
  },
});
</script>
