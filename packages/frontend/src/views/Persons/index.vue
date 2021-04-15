<template>
  <OareContentView title="People (Prosopographical Index)" :loading="loading">
    <letter-filter
      :wordList="personList"
      :letter="letter"
      route="people"
      filterTitle="persons"
      :searchFilter="searchFilter"
      @filtered-words="getFilteredPeople"
    >
    </letter-filter>

    <div v-for="(personInfo, idx) in filteredPersonList" :key="idx">
      <v-row dense>
        <v-col class="font-weight-bold">
          <span class="mr-1">{{ personInfo.person }}</span>
          <span>{{ personInfo.relation }}</span>
          <span class="ml-1 mr-1">{{ personInfo.relationPerson }}</span>
          <a @click="displayPersonTexts(personInfo.uuid)"
            >({{ personInfo.totalReferenceCount }})</a
          >
        </v-col>
      </v-row>
      <v-row dense class="ml-4">
        <v-col class="d-flex flex-row">
          <div
            class="d-flex"
            v-for="(role, roleIdx) in personInfo.roles"
            :key="roleIdx"
          >
            {{ role }}
            <span v-if="isNotLastIndex(roleIdx, personInfo)" class="mr-1"
              >,
            </span>
          </div>
        </v-col>
      </v-row>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import LetterFilter from '@/views/Words/DictionaryWord/LetterFilter.vue';
import { PersonDisplay, EpigraphicTextWithReadings } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'PersonsView',
  components: {
    LetterFilter,
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
    const personList = ref<PersonDisplay[]>([]);
    const filteredPersonList = ref<PersonDisplay[]>([]);

    const searchFilter = (search: string, personDisplay: PersonDisplay) => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        personDisplay.person.toLowerCase().includes(lowerSearch) ||
        personDisplay.relationPerson.toLowerCase().includes(lowerSearch)
      );
    };

    const displayCommentWord = (word: string): string => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    };

    const isNotLastIndex = (
      idx: number,
      personInfo: PersonDisplay
    ): boolean => {
      return idx < personInfo.roles.length - 1;
    };

    const getPeople = async () => {
      try {
        loading.value = true;
        // personList.value = await server.getPeople(props.letter);

        // Individual Person page
        // --Contains same info from phone book page (person, relation, personRelation, clickable references amount)
        // --Also contains expandable lists for each role (and then for future items such as siblings)

        // TODO: Remove once backend is set up.
        personList.value = [
          {
            uuid: 'f9598484-f4cf-4969-a479-904a564d868c',
            word: 'Ali-abum',
            person: 'Ali-abum',
            relation: 's.',
            relationPerson: 'Aššur-mālik',
            roles: [
              'The Borrower',
              'The Receiver of Emails',
              'The Great',
              'The Man that makes Bread',
            ], // on line below, separated by commas
            totalReferenceCount: 1,
            references: [
              {
                textUuid: 'textUuidTest',
                textName: 'textNameTest',
                readings: ['reading1', 'reading2', 'reading3'],
              },
            ] as EpigraphicTextWithReadings[],
          } as PersonDisplay,
          {
            uuid: 'hey',
            word: 'SECOND',
            person: 'SECOND',
            relation: 's.',
            relationPerson: 'ANOTHER SECOND',
            roles: [
              'The Borrower',
              'The Receiver of Emails',
              'The Great',
              'The Man that makes Bread',
            ], // on line below, separated by commas
            totalReferenceCount: 1,
            references: [
              {
                textUuid: 'textUuidTest',
                textName: 'textNameTest',
                readings: ['reading1', 'reading2', 'reading3'],
              },
            ] as EpigraphicTextWithReadings[],
          } as PersonDisplay,
        ] as PersonDisplay[];
      } catch (e) {
        actions.showErrorSnackbar('Failed to retrieve people');
      } finally {
        loading.value = false;
      }
    };

    const getFilteredPeople = (filteredPeople: PersonDisplay[]) => {
      filteredPersonList.value = filteredPeople;
    };

    const displayPersonTexts = (wordUuid: string) => {
      actions.showSnackbar(
        `Will get texts associated with this person in the future`
      );
    };

    onMounted(getPeople);

    return {
      getFilteredPeople,
      searchFilter,
      displayCommentWord,
      isNotLastIndex,
      displayPersonTexts,
      loading,
      personList,
      filteredPersonList,
    };
  },
});
</script>
