<template>
  <v-list-item-content>
    <div class="d-inline-flex flex-row">
      <span class="pr-1" v-if="item.type === 'word' || item.type === 'person'"
        ><b>{{ item.name }}</b>
      </span>
      <span class="pr-1" v-else-if="item.type === 'form'"
        ><em>{{ item.name }}</em>
      </span>
      <span class="pr-1" v-else>{{ item.name }}</span>
      <div v-if="item.type === 'word'" class="d-inline-flex flex-row flex-wrap">
        <v-progress-circular
          indeterminate
          class="pl-3"
          size="14"
          width="2"
          v-if="loading"
        />
        <div v-else>
          <span class="pr-1">{{ translationsString }}</span>
        </div>
      </div>
      <div v-if="item.type === 'person'">(PN)</div>
      <div v-if="item.type === 'form'" class="d-inline-flex flex-row flex-wrap">
        <v-progress-circular
          indeterminate
          class="pl-3"
          size="14"
          width="2"
          v-if="loading"
        />
        <div v-else-if="item.type !== 'number'">
          <span class="pr-1">-</span
          ><span class="pr-1" v-if="grammarString">({{ grammarString }})</span
          ><span class="pr-1"
            >of <b>{{ item.wordName }}</b></span
          ><span>{{ translationsString }}</span>
        </div>
      </div>
      <div
        v-if="item.type === 'spelling'"
        class="d-inline-flex flex-row flex-wrap"
      >
        <v-progress-circular
          class="pl-3"
          indeterminate
          size="14"
          width="2"
          v-if="loading"
        />
        <div v-else>
          <span class="pr-1">-</span
          ><span class="pr-1"
            ><em>{{ item.formInfo.form }}</em></span
          >
          <span class="pr-1">({{ grammarString }})</span
          ><span class="pr-1"
            >of <b>{{ item.wordName }}</b></span
          ><span class="pr-1">{{ translationsString }}</span>
        </div>
      </div>
    </div>
  </v-list-item-content>
</template>
<script lang="ts">
import {
  DictionaryWordTranslation,
  DictItemComboboxDisplay,
  ItemPropertyRow,
} from '@oare/types';
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import utils from '@/utils';

export default defineComponent({
  name: 'WordsInTextSearchComboboxItem',
  props: {
    item: {
      type: Object as PropType<DictItemComboboxDisplay>,
      required: true,
    },
  },
  setup(props) {
    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');
    const loading = ref(false);
    const grammarString = ref('');
    const translationsString = ref('');

    onMounted(async () => {
      try {
        loading.value = true;
        translationsString.value = await server
          .getTranslationsByWordUuid(props.item.wordUuid)
          .then((translations: DictionaryWordTranslation[]) =>
            translations.map((tr, idx) => `${idx + 1}. '${tr.val}'`).join(', ')
          );
        if (props.item.type === 'form') {
          grammarString.value = await server
            .getPropertiesByReferenceUuid(props.item.uuid)
            .then((properties: ItemPropertyRow[]) =>
              utils.formGrammarString({
                ...props.item.formInfo!!,
                properties: properties,
              })
            );
        }
        if (props.item.type === 'spelling') {
          grammarString.value = await server
            .getPropertiesByReferenceUuid(props.item.referenceUuid)
            .then((properties: ItemPropertyRow[]) =>
              utils.formGrammarString({
                ...props.item.formInfo!!,
                properties: properties,
              })
            );
        }
      } catch (err) {
        actions.showErrorSnackbar(
          `Error loading ${props.item.name}. Please try again.`,
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });
    return {
      loading,
      grammarString,
      translationsString,
    };
  },
});
</script>
