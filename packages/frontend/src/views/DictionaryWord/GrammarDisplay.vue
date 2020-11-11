<template>
  <div>
    <span class="mx-1" v-if="formGrammar !== ''">({{ formGrammar }})</span>
    <span v-for="(s, index) in form.spellings" :key="index">
      <span>{{ s.spelling }}</span>
      <span v-if="s.texts.length > 0">
        (<a @click="showTexts(index)">{{ s.texts.length }}</a
        >)</span
      >
      <span v-if="index !== form.spellings.length - 1" class="mr-1">,</span>
    </span>
    <OareDialog
      v-model="dialogOpen"
      :title="`Texts for ${dialogTitle}`"
      :showSubmit="false"
      cancelText="Close"
      :persistent="false"
    >
      <v-data-table :headers="headers" :items="spellingTexts">
        <template #[`item.text`]="{ item }">
          <router-link :to="`/epigraphies/${item.uuid}`">{{
            item.text
          }}</router-link>
        </template>
      </v-data-table>
    </OareDialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  Ref,
  reactive,
} from '@vue/composition-api';
import { DictionaryForm, SpellingText } from '@oare/types';
import { DataTableHeader } from 'vuetify';

export default defineComponent({
  props: {
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
  },
  setup({ form }) {
    const dialogOpen = ref(false);
    const dialogTitle = ref('');
    const headers: DataTableHeader[] = reactive([
      {
        text: 'Text Name',
        value: 'text',
      },
    ]);
    const spellingTexts: Ref<SpellingText[]> = ref([]);

    const showTexts = (spellingIndex: number) => {
      dialogOpen.value = true;
      dialogTitle.value = form.spellings[spellingIndex].spelling;
      spellingTexts.value = form.spellings[spellingIndex].texts;
    };

    const formGrammar = computed(() => {
      let suffix = '';

      if (form.suffix) {
        suffix =
          form.suffix.persons.join('') +
          form.suffix.genders.join('') +
          form.suffix.grammaticalNumbers.join('') +
          form.suffix.cases.join('');
        if (form.clitics.includes('-ma')) {
          suffix += '-ma';
        }
      }
      return (
        form.stems.join('') +
        form.morphologicalForms
          .filter(mf => mf === 'stv.' || mf === 'inf')
          .join('') +
        form.tenses.join('') +
        ' ' +
        form.persons.join('') +
        form.genders.join('') +
        form.grammaticalNumbers.join('') +
        form.cases.join('') +
        ' ' +
        form.states.join('') +
        form.moods.join('') +
        form.clitics
          .map(clitic => {
            if (clitic === 'suf.') return '+';
            if (clitic === 'vent') return '+vent';
            return clitic;
          })
          .filter(clitic => clitic !== '-ma')
          .join('') +
        suffix
      ).trim();
    });

    return {
      formGrammar,
      dialogOpen,
      dialogTitle,
      showTexts,
      headers,
      spellingTexts,
    };
  },
});
</script>
