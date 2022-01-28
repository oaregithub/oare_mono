<template>
  <div>
    <b>{{ property.variableName }}</b> - <i>{{ property.valueName }}</i>
    <div v-if="property.children.length > 0" class="pl-4">
      <property-card-unit
        v-for="(prop, idx) in property.children"
        :key="idx"
        :property="prop"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { ItemPropertyRowWithChildren } from '@oare/types';

export default defineComponent({
  name: 'PropertyCardUnit',
  props: {
    property: {
      type: Object as PropType<ItemPropertyRowWithChildren>,
      required: true,
    },
  },
});
</script>