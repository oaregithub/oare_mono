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

    <v-btn
      color="#ffffff"
      elevation="0"
      class="mt-4 px-2"
      @click="addWordDialog = true"
    >
      <v-icon color="primary">mdi-plus</v-icon>
      <h3 class="text--primary">Add Lemma</h3>
    </v-btn>

    <add-word-dialog
      v-model="addWordDialog"
      :wordList="wordList"
      :key="addWordKey"
      closeOnSubmit
    ></add-word-dialog>

    <v-container>
      <v-row no-gutters>
        <v-col cols="10">
          <div
            v-for="wordInfo in filteredWords"
            :key="wordInfo.uuid"
            class="mb-3"
          >
            <div class="d-flex">
              <slot name="word" :word="wordInfo"> </slot>
              <slot name="translation" :word="wordInfo"></slot>
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
  InjectionKey,
  provide,
  watch,
} from '@vue/composition-api';
import LetterFilter from '@/components/DictionaryDisplay/DictionaryWord/LetterFilter.vue';
import { DisplayableWord, ParseTreeProperty } from '@oare/types';
import AddWordDialog from './DictionaryWord/AddWordDialog.vue';
import properties from '@/serverProxy/properties';
import AddProperties from '@/components/Properties/AddProperties.vue';

export const AddWordReloadKey: InjectionKey<() => Promise<void>> = Symbol();

export default defineComponent({
  name: 'DictionaryDisplay',
  components: {
    LetterFilter,
    AddWordDialog,
    AddProperties,
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
  setup(props) {
    const addWordDialog = ref(false);
    const filteredWords = ref<DisplayableWord[]>([]);

    const getWords = (words: DisplayableWord[]) => {
      filteredWords.value = words;
    };

    provide(AddWordReloadKey, getWords);

    const highlight = [
      { bin: '0-10', color: '#caf0f8' },
      { bin: '11-100', color: '#90e0ef' },
      { bin: '101-1000', color: '#e0aaff' },
      { bin: '1001-10000', color: '#c77dff' },
      { bin: '10001-25000', color: '#ffccd5' },
      { bin: '25001+', color: '#ff8fa3' },
    ];

    const properties = ref<ParseTreeProperty[]>([]);
    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const addWordKey = ref(false);
    watch(addWordDialog, () => {
      if (addWordDialog.value) {
        addWordKey.value = !addWordKey.value;
        properties.value = [];
      }
    });

    return {
      filteredWords,
      getWords,
      highlight,
      addWordDialog,
      addWordKey,
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
