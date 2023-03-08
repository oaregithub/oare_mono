<template>
  <v-col :cols="dynamicCol(month.abbreviation)" class="pa-2">
    <v-card outlined min-height="150">
      <v-card-subtitle
        >{{ month.abbreviation }}. {{ month.name }} ({{
          month.occurrences
        }})</v-card-subtitle
      >
      <div v-if="month.weeks.length > 0">
        <v-card-text
          v-for="(week, idx) in getWeeks(month.weeks)"
          :key="idx"
        >
          {{ week.name }} ({{ week.occurrences }})
        </v-card-text>
      </div>
    </v-card>
  </v-col>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Year, Month, Week } from '@oare/types';

export default defineComponent({
  name: 'PeriodMonth',
  props: {
    year: {
      type: Object as PropType<Year>,
      required: true,
    },
    month: {
      type: Object as PropType<Month>,
      required: true,
    },
  },
  setup() {
    const dynamicCol = (abbreviation: number) => {
      if (abbreviation < 13) {
        return 2;
      } else {
        return 10;
      }
    };

    const getWeekNames = (weeks: Week[]) => {
      return weeks.map(week => week.name);
    };

    const getWeeks = (weeks: Week[]) => {
      weeks.map(week => week.name);
      weeks.map(week => week.occurrences)
      return weeks;
    };

    return {
      dynamicCol,
      getWeekNames,
      getWeeks
      
    };
  },
});
</script>
