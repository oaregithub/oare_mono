<template>
  <OareContentView
    title="People (Prosopographical Index)"
    :loading="initialLoading"
  >
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
            <span @click="personNotFound" class="mr-1">{{
              personInfo.label
            }}</span>
          </span>
          <a
            @click="displayPersonTexts(personInfo.personNameUuid)"
            class="test-person-texts"
            >({{ personInfo.totalReferenceCount }})</a
          >
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
      v-if="loading"
      class="d-flex align-center justify-center pt-2 pb-2 rounded-pill loading-container"
    >
      <span class="mr-2"
        >Loading more people... ({{ filteredPersonList.length }} /
        {{ totalPersonCount }})</span
      >
      <v-progress-circular
        indeterminate
        :size="20"
        color="primary"
      ></v-progress-circular>
    </div>

    <div
      v-if="intersecting && hasCollectedAllPeople()"
      class="d-flex align-center justify-center pt-2 pb-2 rounded-pill loading-container"
    >
      <span
        >All people have been retrieved ({{ personList.length }} /
        {{ totalPersonCount }})</span
      >
    </div>

    <div v-intersect="onIntersect"></div>
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
import { PersonDisplay, GetAllPeopleRequest } from '@oare/types';
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

    const initialLoading = ref(false);
    const loading = ref(false);
    const intersecting = ref(false);
    const personList = ref<PersonDisplay[]>([]);
    const totalPersonCount = ref(0);
    const filteredPersonList = ref<PersonDisplay[]>([]);
    const peoplePerScroll = ref(50);

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

    const displayCommentWord = (word: string): string => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    };

    const getPeople = async () => {
      try {
        loading.value = true;

        const request = {
          letter: props.letter,
          limit: peoplePerScroll.value,
          page: personList.value.length,
        } as GetAllPeopleRequest;
        const people = await server.getPeople(request);
        personList.value.push(...people);

        // Individual Person page
        // --Contains same info from phone book page (person, relation, personRelation, clickable references amount)
        // --Also contains expandable lists for each role (and then for future items such as siblings)
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

    const displayPersonTexts = (wordUuid: string) => {
      actions.showSnackbar(
        `Will get texts associated with this person in the future`
      );
    };

    const personNotFound = () => {
      actions.showSnackbar('No person available.');
    };

    const isAdmin = computed(() => store.getters.isAdmin);

    const hasCollectedAllPeople = (): boolean => {
      return totalPersonCount.value == personList.value.length;
    };

    const isLoading = (): boolean => {
      return loading.value || initialLoading.value;
    };

    const onIntersect = async (
      _entries: any,
      _observer: any,
      isIntersecting: boolean
    ) => {
      intersecting.value = isIntersecting;
      if (isIntersecting && !isLoading() && !hasCollectedAllPeople()) {
        try {
          await getPeople();
        } catch (ex) {
          actions.showErrorSnackbar('Failed to retrieve more people');
        }
      }
    };

    const mount = async () => {
      try {
        initialLoading.value = true;
        personList.value = [];
        await getPeople();
        totalPersonCount.value = await server.getPeopleCount(props.letter);
      } catch (ex) {
        actions.showErrorSnackbar('Failed to retrieve person count');
      } finally {
        initialLoading.value = false;
      }
    };

    watch(
      () => props.letter,
      async () => {
        await mount();
      }
    );

    onMounted(mount);

    return {
      getFilteredPeople,
      searchFilter,
      displayCommentWord,
      displayPersonTexts,
      hasPerson,
      hasRelationPerson,
      hasValueRole,
      hasVariableRole,
      hasObjUuid,
      displayVariableRole,
      personNotFound,
      onIntersect,
      hasCollectedAllPeople,
      intersecting,
      initialLoading,
      loading,
      personList,
      filteredPersonList,
      totalPersonCount,
      isAdmin,
    };
  },
});
</script>

<style scoped>
.loading-container {
  background-color: lightgray;
}
</style>
