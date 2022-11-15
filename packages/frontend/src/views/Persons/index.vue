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
      class="ma-0 ml-3"
    >
      <router-link :to="`/person/${person.person.uuid}`" class="mr-1">
        {{ person.display }}</router-link
      >
      <a @click="setupOccurrencesDialog(person)"
        >({{
          personsOccurrencesCountsLoading
            ? 'Loading...'
            : getPersonOccurrencesCountsByUuid(person.person.uuid)
        }})</a
      >
    </v-row>
    <text-occurrences
      v-if="selectedPerson"
      v-model="textOccurrencesDialog"
      :title="selectedPerson.display"
      :uuids="[selectedPerson.person.uuid]"
      :totalTextOccurrences="
        getPersonOccurrencesCountsByUuid(selectedPerson.person.uuid)
      "
      :getTexts="server.getPersonsOccurrencesTexts"
      :getTextsCount="server.getPersonsOccurrencesCounts"
    />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from '@vue/composition-api';
import { PersonListItem, TextOccurrencesCountResponseItem } from '@oare/types';
import sl from '@/serviceLocator';
import TextOccurrences from '@/components/TextOccurrences/index.vue';

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

    const personsOccurrencesCounts = ref<TextOccurrencesCountResponseItem[]>(
      []
    );
    const personsOccurrencesCountsLoading = ref(false);

    const searchFilter = (search: string, personDisplay: PersonListItem) => {
      return personDisplay.display
        .toLowerCase()
        .includes(search.toLocaleLowerCase());
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

    watch(personList, async () => {
      if (personList.value.length > 0) {
        try {
          personsOccurrencesCountsLoading.value = true;
          personsOccurrencesCounts.value =
            await server.getPersonsOccurrencesCounts(
              personList.value.map(person => person.person.uuid)
            );
        } catch (err) {
          actions.showErrorSnackbar(
            'Failed to retrieve persons occurrences counts. Please try again.',
            err as Error
          );
        } finally {
          personsOccurrencesCountsLoading.value = false;
        }
      }
    });

    const getPersonOccurrencesCountsByUuid = (uuid: string) => {
      const personOccurrencesCount = personsOccurrencesCounts.value.find(
        item => item.uuid === uuid
      );
      return personOccurrencesCount ? personOccurrencesCount.count : 0;
    };

    const textOccurrencesDialog = ref(false);
    const selectedPerson = ref<PersonListItem | null>(null);

    const setupOccurrencesDialog = (person: PersonListItem) => {
      selectedPerson.value = person;
      textOccurrencesDialog.value = true;
    };

    return {
      filterPersons,
      searchFilter,
      loading,
      personList,
      filteredPersonList,
      server,
      personsOccurrencesCounts,
      personsOccurrencesCountsLoading,
      getPersonOccurrencesCountsByUuid,
      textOccurrencesDialog,
      selectedPerson,
      setupOccurrencesDialog,
    };
  },
});
</script>
