<template>
  <div>
    <letter-filter
      :route="route"
      :word-list="wordList"
      :letter="letter"
      :search-filter="searchFilter"
      @filtered-words="getWords"
    >
    </letter-filter>

    <add-word-dialog
      v-if="canAddWords"
      v-model="addWordDialog"
      :key="addWordKey"
      :route="route"
    ></add-word-dialog>

    <v-container>
      <v-row no-gutters>
        <v-col cols="10">
          <v-btn
            v-if="canAddWords"
            text
            color="primary"
            class="mb-8"
            @click="addWordDialog = true"
          >
            <v-icon>mdi-plus</v-icon>
            <h3>Add Lemma</h3>
          </v-btn>
          <div
            v-for="wordInfo in filteredWords"
            :key="wordInfo.uuid"
            class="mb-3"
          >
            <div class="d-flex">
              <slot name="word" :word="wordInfo"> </slot>
              <slot name="translationsForDefinition" :word="wordInfo"></slot>
            </div>
            <div>
              <slot name="forms" :word="wordInfo"></slot>
            </div>
          </div>
        </v-col>
        <v-col cols="2">
          <v-container class="sticky">
            <p class="font-weight-bold">Frequency</p>
            <div v-for="n in 6" :key="n">
              <v-card-text
                class="pa-2 mx-auto"
                width="200px"
                :style="`background: ${highlight[n - 1].color}`"
              >
                {{ highlight[n - 1].bin }}
              </v-card-text>
            </div>
          </v-container>
        </v-col>
      </v-row>
    </v-container>
    <v-btn fab fixed bottom right @click="$vuetify.goTo(0)" color="info">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  PropType,
  watch,
  computed,
} from '@vue/composition-api';
import LetterFilter from '@/components/DictionaryDisplay/DictionaryWord/LetterFilter.vue';
import { DisplayableWord, ParseTreeProperty } from '@oare/types';
import sl from '@/serviceLocator';
import AddWordDialog from './DictionaryWord/AddWordDialog.vue';

export default defineComponent({
  name: 'DictionaryDisplay',
  components: {
    LetterFilter,
    AddWordDialog,
  },
  props: {
    wordList: {
      type: Array as PropType<DisplayableWord[]>,
      required: true,
    },
    letter: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
    searchFilter: {
      type: Function as PropType<
        (search: string, word: DisplayableWord) => boolean
      >,
      default: () => {
        return () => true;
      },
    },
    filterTitle: {
      type: String,
      default: 'words',
    },
  },
  setup() {
    const store = sl.get('store');
    const addWordDialog = ref(false);
    const filteredWords = ref<DisplayableWord[]>([]);
    const canAddWords = computed(() => store.hasPermission('ADD_LEMMA'));

    const getWords = (words: DisplayableWord[]) => {
      filteredWords.value = words;
    };

    const highlight = [
      { bin: '0-10', color: '#caf0f8' },
      { bin: '11-100', color: '#90e0ef' },
      { bin: '101-1000', color: '#e0aaff' },
      { bin: '1001-10000', color: '#c77dff' },
      { bin: '10001-25000', color: '#ffccd5' },
      { bin: '25001+', color: '#ff8fa3' },
    ];

    const addWordKey = ref(false);
    watch(addWordDialog, () => {
      if (addWordDialog.value) {
        addWordKey.value = !addWordKey.value;
      }
    });

    return {
      filteredWords,
      getWords,
      highlight,
      addWordDialog,
      addWordKey,
      canAddWords,
    };
  },
});
</script>

<style scoped>
.sticky {
  position: sticky;
  top: 2in;
}
</style>
