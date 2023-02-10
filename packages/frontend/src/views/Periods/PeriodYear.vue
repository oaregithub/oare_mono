<template>
  <v-card outlined class="ma-10 pa-2">
    <v-card-title
      >{{ year.number }} - {{ year.name }} ({{
        year.occurrences
      }})</v-card-title
    >
    <v-row class="ma-4">
      <v-col cols="9">
        <v-row>
          <PeriodMonth
            v-for="(month, idx) in standardMonths"
            :key="idx"
            :year="year"
            :month="month"
          >
          </PeriodMonth>
        </v-row>
      </v-col>
      <v-col cols="3" class="d-flex justify-center align-center">
        <v-row class="ml-14">
          <PeriodMonth
            v-for="(month, idx) in intercalaryMonth"
            :key="idx"
            :year="year"
            :month="month"
          >
          </PeriodMonth>
        </v-row>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
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

  setup(props) {
    const standardMonths = computed(() =>
      props.year.months.filter(month => month.abbreviation < 13)
    );
    const intercalaryMonth = computed(() =>
      props.year.months.filter(month => month.abbreviation > 12)
    );
    return {
      standardMonths,
      intercalaryMonth,
    };
  },
});
</script>
