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

    <div
      v-for="(personInfo, idx) in filteredPersonList"
      :key="idx"
      class="test-person-row"
    >
      <v-row dense>
        <v-col class="font-weight-bold">
          <span v-if="hasPerson(personInfo) && hasRelationPerson(personInfo)">
            <router-link
              :to="`person/${personInfo.uuid}`"
              class="text-decoration-none"
            >
              <span class="mr-1">{{ personInfo.person }}</span>
              <span>{{ personInfo.relation }}</span>
              <span class="ml-1 mr-1">{{ personInfo.relationPerson }}</span>
            </router-link>
          </span>
          <span v-else>
            <router-link
              :to="`person/${personInfo.uuid}`"
              class="text-decoration-none mr-1"
            >
              {{ personInfo.label }}
            </router-link>
          </span>

          <span
            v-if="personInfo.textOccurrenceCount === null && isAdmin"
            class="error--text"
          >
            (No count found, please update the database)
          </span>
          <span>
            (<a @click="displayPersonOccurrencesDialog"
              >{{
                personInfo.textOccurrenceCount !== null
                  ? personInfo.textOccurrenceCount
                  : 0
              }})</a
            >
          </span>
        </v-col>
      </v-row>
      <v-row dense class="ml-4">
        <v-col class="d-flex flex-row">
          <div v-if="hasValueRole(personInfo)" class="d-flex test-role-value">
            {{ personInfo.topValueRole }}
          </div>
          <div
            v-else-if="hasObjUuid(personInfo)"
            class="d-flex test-role-variable"
          >
            {{ displayVariableRole(personInfo) }}
          </div>
          <div v-else class="d-flex">
            <span v-if="isAdmin" class="error--text test-role-variable-error">{{
              personInfo.topVariableRole
            }}</span>
          </div>
        </v-col>
      </v-row>
    </div>

    <div
      v-if="personList.length === 0 && !loading"
      class="d-flex align-center justify-center pt-2 pb-2 rounded-pill loading-container primary"
    >
      <span class="white--text">No results found </span>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import LetterFilter from '@/views/Words/DictionaryWord/LetterFilter.vue';
import { PersonDisplay } from '@oare/types';
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
    const store = sl.get('store');
    const loading = ref(false);
    const personList = ref<PersonDisplay[]>([]);
    const filteredPersonList = ref<PersonDisplay[]>([]);

    const searchFilter = (search: string, personDisplay: PersonDisplay) => {
      const lowerSearch = search ? search.toLowerCase() : '';

      let foundPerson = false;
      let foundRelationPerson = false;
      let foundLabel = false;

      if (personDisplay.person !== null) {
        foundPerson = personDisplay.person.toLowerCase().includes(lowerSearch);
      }

      if (personDisplay.relationPerson !== null) {
        foundRelationPerson = personDisplay.relationPerson
          .toLowerCase()
          .includes(lowerSearch);
      }

      if (
        personDisplay.person === null &&
        personDisplay.relationPerson === null
      ) {
        foundLabel = personDisplay.label.toLowerCase().includes(lowerSearch);
      }

      return foundPerson || foundRelationPerson || foundLabel;
    };

    const getPeople = async () => {
      try {
        loading.value = true;
        personList.value = await server.getPeople(props.letter);
      } catch (e) {
        actions.showErrorSnackbar('Failed to retrieve people');
      } finally {
        loading.value = false;
      }
    };

    const getFilteredPeople = (filteredPeople: PersonDisplay[]) => {
      filteredPersonList.value = filteredPeople;
    };

    const hasPerson = (personDisplay: PersonDisplay): boolean => {
      return personDisplay.person !== null;
    };

    const hasRelationPerson = (personDisplay: PersonDisplay): boolean => {
      return personDisplay.relationPerson !== null;
    };

    const hasValueRole = (personDisplay: PersonDisplay): boolean => {
      return personDisplay.topValueRole !== null;
    };

    const hasVariableRole = (personDisplay: PersonDisplay): boolean => {
      return personDisplay.topVariableRole !== null;
    };

    const hasObjUuid = (personDisplay: PersonDisplay): boolean => {
      return personDisplay.roleObjUuid !== null;
    };

    const displayVariableRole = (personDisplay: PersonDisplay): string => {
      // Example: `Father of Ali-abum`
      return `${personDisplay.topVariableRole} of ${personDisplay.roleObjPerson}`;
    };

    const displayPersonOccurrencesDialog = () => {
      actions.showSnackbar('This will display occurrences at a later date.');
    };

    const isAdmin = computed(() => store.getters.isAdmin);

    watch(
      () => props.letter,
      async () => {
        await getPeople();
      }
    );

    onMounted(getPeople);

    return {
      getFilteredPeople,
      searchFilter,
      displayPersonOccurrencesDialog,
      hasPerson,
      hasRelationPerson,
      hasValueRole,
      hasVariableRole,
      hasObjUuid,
      displayVariableRole,
      loading,
      personList,
      filteredPersonList,
      isAdmin,
    };
  },
});
</script>
