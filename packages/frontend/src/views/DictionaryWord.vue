<template>
  <OareContentView :title="wordInfo ? wordInfo.word : ''" :loading="loading">
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>

    <div v-if="wordInfo">
      <div class="d-flex">
        <div v-if="wordInfo.partsOfSpeech.length > 0" class="mr-1">
          {{ wordInfo.partsOfSpeech.join(', ') }}
        </div>
        <div v-if="wordInfo.verbalThematicVowelTypes.length > 0" class="mr-1">
          ({{ wordInfo.verbalThematicVowelTypes.join(', ') }})
        </div>
        <p>
          <span v-for="(tr, idx) in wordInfo.translations" :key="idx">
            <b>{{ idx + 1 }}</b
            >. {{ tr }}
          </span>
          <span
            v-if="
              wordInfo.translations.length > 0 &&
                wordInfo.specialClassifications.length > 0
            "
            >;</span
          >
          <span v-if="wordInfo.specialClassifications.length > 0">
            {{ wordInfo.specialClassifications.join(', ') }}
          </span>
        </p>
      </div>
      <div v-if="wordInfo.forms.length < 1">
        No forms found for {{ wordInfo.word }}
      </div>
      <div v-for="(formInfo, idx) in wordInfo.forms" :key="idx" class="d-flex">
        <strong class="mr-1">{{ formInfo.form }}</strong>
        <span class="mr-1" v-if="formGrammar(formInfo).trim() !== ''"
          >({{ formGrammar(formInfo) }})</span
        >
        <span>{{ formInfo.spellings.map(sp => sp.spelling).join(', ') }}</span>
      </div>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  watch,
  computed
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { WordWithForms, DictionaryForm } from '@/types/dictionary';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import serverProxy from '../serverProxy';

export default defineComponent({
  name: 'DictionaryWord',
  props: {
    uuid: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const loading = ref(true);
    const wordInfo: Ref<WordWithForms | null> = ref(null);
    const breadcrumbItems: Ref<BreadcrumbItem[]> = ref([
      {
        link: '/words/A',
        text: 'Dictionary Words'
      }
    ]);

    const formGrammar = (form: DictionaryForm) => {
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
      );
    };

    watch(
      () => props.uuid,
      async () => {
        loading.value = true;
        wordInfo.value = await serverProxy.getDictionaryInfo(props.uuid);
        for (const [letterGroup, letters] of Object.entries(
          AkkadianLetterGroupsUpper
        )) {
          if (letters.includes(wordInfo.value.word[0].toUpperCase())) {
            breadcrumbItems.value.push({
              link: `/words/${encodeURIComponent(letterGroup)}`,
              text: letterGroup
            });
            break;
          }
        }
        breadcrumbItems.value.push({
          link: null,
          text: wordInfo.value.word
        });
        loading.value = false;
      }
    );
    return {
      loading,
      wordInfo,
      breadcrumbItems,
      formGrammar
    };
  }
});
</script>
