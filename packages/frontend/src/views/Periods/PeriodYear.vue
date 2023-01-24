<template>
  <v-card outlined class="mb-7">
    <v-card-title
      >{{ year.number }} - {{ year.name }} ({{
        year.occurrences
      }})</v-card-title
    >
    <v-row no-gutters>
      <PeriodMonth
        v-for="(month, idx) in year.months"
        :key="idx"
        :year="year"
        :month="month"
      >
      </PeriodMonth>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Year } from '@oare/types';
import PeriodMonth from './PeriodMonth.vue';

export default defineComponent({
  name: 'PeriodYear',
  components: { PeriodMonth },
  props: {
    year: {
      type: Object as PropType<Year>,
      required: true,
    },
  },

  setup() {
    return;
  },
});
</script>
