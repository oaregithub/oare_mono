<template>
  <div class="px-1 cursor-display d-inline-block" @click="openDiscourseDialog">
    <v-row class="pa-0 ma-0 oare-title" justify="center">
      <span v-if="reading" v-html="reading" />
      <span v-else>{{ word.spelling }}</span>
    </v-row>
    <v-row class="pa-0 text-body-2 ma-0 grey--text" justify="center">
      <v-progress-circular
        indeterminate
        color="primary"
        size="25"
        v-if="formsLoading"
      />
      <v-chip
        v-else-if="!isNumber && !isUndetermined && !isSeparator"
        :color="getColor()"
        small
        >{{ getSelectedForm() }}</v-chip
      >
    </v-row>
    <connect-discourse-dialog
      v-model="discourseDialog"
      :spelling="word.spelling"
      :forms="forms"
      :spellingUuid="
        selectedSpelling ? selectedSpelling.spellingUuid : undefined
      "
      @set-spelling="setSpelling"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  onMounted,
  computed,
  watch,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { EditorDiscourseWord, SearchSpellingResultRow } from '@oare/types';
import ConnectDiscourseDialog from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseDialog.vue';

export default defineComponent({
  props: {
    word: {
      type: Object as PropType<EditorDiscourseWord>,
      required: true,
    },
    reading: {
      type: String,
      required: false,
    },
  },
  components: {
    ConnectDiscourseDialog,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const isNumber = computed(() => {
      return props.word.type === 'number';
    });

    const isUndetermined = computed(() => {
      return (
        props.word.spelling.includes('...') ||
        props.word.spelling.match(/x+/) ||
        (props.reading && props.reading.includes('...')) ||
        (props.reading && props.reading.match(/x+/))
      );
    });

    const isSeparator = computed(() => {
      return (
        props.word.spelling === '|' ||
        (props.reading && props.reading.includes('|'))
      );
    });

    const getColor = () => {
      if (!props.word.discourseUuid) {
        return 'red';
      }

      if (forms.value.length === 0) {
        return 'red';
      }

      if (selectedSpelling.value) {
        return 'green';
      }

      return 'yellow';
    };

    const forms = ref<SearchSpellingResultRow[]>([]);
    const formsLoading = ref(false);

    onMounted(async () => {
      try {
        formsLoading.value = true;
        emit('loading-forms');
        forms.value = await server.searchSpellings(props.word.spelling);
        if (forms.value.length === 1) {
          selectedSpelling.value = forms.value[0];
        }

        if (forms.value.length >= 2) {
          const formsByOccurrences = forms.value
            .sort((a, b) => b.occurrences - a.occurrences)
            .map(form => form.occurrences);
          if (formsByOccurrences[0] > formsByOccurrences[1] * 2) {
            selectedSpelling.value = forms.value[0];
          }
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading spelling options. Please try again.',
          err as Error
        );
      } finally {
        formsLoading.value = false;
        emit('loaded-forms');
      }
    });

    const getSelectedForm = () => {
      if (selectedSpelling.value) {
        return forms.value.filter(
          form => form.spellingUuid === selectedSpelling.value?.spellingUuid
        )[0].form.form;
      } else {
        return '--';
      }
    };

    const discourseDialog = ref(false);
    const openDiscourseDialog = () => {
      discourseDialog.value = true;
    };

    const selectedSpelling = ref<SearchSpellingResultRow>();
    const setSpelling = (spelling: SearchSpellingResultRow | undefined) => {
      selectedSpelling.value = spelling || undefined;
    };

    watch(selectedSpelling, () =>
      emit('update-spelling', selectedSpelling.value)
    );

    return {
      isNumber,
      isUndetermined,
      isSeparator,
      getColor,
      getSelectedForm,
      forms,
      formsLoading,
      discourseDialog,
      openDiscourseDialog,
      setSpelling,
      selectedSpelling,
    };
  },
});
</script>
