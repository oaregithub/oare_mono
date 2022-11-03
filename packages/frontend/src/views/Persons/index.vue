<template>
  <OareContentView title="People (Prosopographical Index)" :loading="loading">
    <oare-letter-filter
      :letter="letter"
      route="people"
      filterTitle="persons"
      @search-input="filterPersons"
    />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from '@vue/composition-api';
import { PersonListItem } from '@oare/types';
import sl from '@/serviceLocator';
import OareLetterFilter from '@/components/base/OareLetterFilter.vue';
import TextOccurrences from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/TextOccurrences.vue';

export default defineComponent({
  name: 'PersonsView',
  components: {
    OareLetterFilter,
    TextOccurrences,
  },
  props: {
    letter: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);
    const personList = ref<PersonListItem[]>([]);
    const filteredPersonList = ref<PersonListItem[]>([]);

    const searchFilter = (
      _search: string,
      _personDisplay: PersonListItem
    ): boolean => {
      return true;
    };

    const getPeople = async () => {
      try {
        loading.value = true;
        personList.value = []; // Replace with call to server
        filteredPersonList.value = personList.value;
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve people. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    const filterPersons = (search: string) => {
      filteredPersonList.value = personList.value.filter(person =>
        searchFilter(search, person)
      );
    };

    watch(
      () => props.letter,
      async () => {
        await getPeople();
      }
    );

    onMounted(async () => {
      await getPeople();
    });

    return {
      filterPersons,
      searchFilter,
      loading,
      personList,
      filteredPersonList,
      server,
    };
  },
});
</script>
