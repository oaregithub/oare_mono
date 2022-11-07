<template>
  <OareContentView
    title="Persons (Prosopographical Index)"
    informationCard="The list of persons here is under development. There are many duplicates of the type A f. (father of) B and A f. C where A is the same person. In addition, there are surely many persons missing from the current index."
    :loading="loading"
  >
    <oare-letter-filter
      :letter="letter"
      route="persons"
      filterTitle="persons"
      @search-input="filterPersons"
    />
    <v-row
      v-for="(person, idx) in filteredPersonList"
      :key="idx"
      class="ma=0 ml-3"
    >
      <router-link :to="`/person/${person.person.uuid}`" class="mr-1">
        {{ person.display }}</router-link
      >
      <span>({{ person.occurrences }})</span>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from '@vue/composition-api';
import { PersonListItem } from '@oare/types';
import sl from '@/serviceLocator';
import TextOccurrences from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/TextOccurrences.vue';

export default defineComponent({
  name: 'PersonsView',
  components: {
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

    const searchFilter = (search: string, personDisplay: PersonListItem) => {
      if (
        personDisplay.person.label
          .toLowerCase()
          .includes(search.toLocaleLowerCase())
      ) {
        return true;
      }
    };

    const getPersons = async () => {
      try {
        loading.value = true;
        personList.value = await server.getPersons(props.letter);
        filteredPersonList.value = personList.value;
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve persons. Please try again.',
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
        await getPersons();
      }
    );

    onMounted(async () => {
      await getPersons();
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
