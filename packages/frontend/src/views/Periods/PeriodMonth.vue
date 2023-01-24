<template>
  <v-card outlined>
    <v-card-subtitle>{{ month.name }}</v-card-subtitle>
    <div v-if="month.weeks.length > 0">
      <v-card-text v-for="(week, idx) in getWeekNames(month.weeks)" :key="idx">
        {{ week }}
      </v-card-text>
    </div>
  </v-card>
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
    const getWeekNames = (weeks: Week[]) => {
      return weeks.map(week => week.name);
    };
    return {
      getWeekNames,
    };
  },
});
</script>
