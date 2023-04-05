<template>
  <OareContentView :loading="loading" :title="person.display">
    <template #title:post
      ><a class="ml-1" @click="handleSelectOccurrences(undefined)"
        >({{ occurrencesLoading ? 'Loading...' : occurrencesCount }})</a
      ></template
    >
    <div v-if="personHasData">
      <v-row
        v-for="(field, idx) in person.discussion"
        :key="idx"
        class="ma-0"
        >{{ field.field }}</v-row
      >

      <div v-if="person.father">
        <b>Father: </b
        ><router-link :to="`/person/${person.father.uuid}`">{{
          person.father.display
        }}</router-link>
      </div>

      <div v-if="person.mother">
        <b>Mother: </b
        ><router-link :to="`/person/${person.mother.uuid}`">{{
          person.mother.display
        }}</router-link>
      </div>

      <div v-if="person.asshatumWives.length > 0">
        <b>Aššutum Wife/Wives: </b>
        <span v-for="(wife, idx) in person.asshatumWives" :key="idx">
          <router-link :to="`/person/${wife.uuid}`">{{
            wife.display
          }}</router-link>
          <span v-if="idx < person.asshatumWives.length - 1">{{ ', ' }}</span>
        </span>
      </div>

      <div v-if="person.amtumWives.length > 0">
        <b>Amtum Wife/Wives: </b>
        <span v-for="(wife, idx) in person.amtumWives" :key="idx">
          <router-link :to="`/person/${wife.uuid}`">{{
            wife.display
          }}</router-link>
          <span v-if="idx < person.amtumWives.length - 1">{{ ', ' }}</span>
        </span>
      </div>

      <div v-if="person.husbands.length > 0">
        <b>Husband(s): </b>
        <span v-for="(husband, idx) in person.husbands" :key="idx">
          <router-link :to="`/person/${husband.uuid}`">{{
            husband.display
          }}</router-link>
          <span v-if="idx < person.husbands.length - 1">{{ ', ' }}</span>
        </span>
      </div>

      <div v-if="person.siblings.length > 0">
        <b>Sibling(s): </b>
        <span v-for="(sibling, idx) in person.siblings" :key="idx">
          <router-link :to="`/person/${sibling.uuid}`">{{
            sibling.display
          }}</router-link>
          <span v-if="idx < person.siblings.length - 1">{{ ', ' }}</span>
        </span>
      </div>

      <div v-if="person.children.length > 0">
        <b>Children: </b>
        <span v-for="(child, idx) in person.children" :key="idx">
          <router-link :to="`/person/${child.uuid}`">{{
            child.display
          }}</router-link>
          <span v-if="idx < person.children.length - 1">{{ ', ' }}</span>
        </span>
      </div>

      <div v-if="person.durableRoles.length > 0">
        <b>Durable Roles: </b
        ><span v-for="(role, idx) in person.durableRoles" :key="idx"
          >{{ role.role }}
          <a @click="handleSelectOccurrences(role)">({{ role.occurrences }})</a>
          <span v-if="idx < person.durableRoles.length - 1"
            >{{ ', ' }}
          </span></span
        >
      </div>

      <div v-if="person.temporaryRoles.length > 0">
        <b>Temporary Roles: </b
        ><span v-for="(role, idx) in person.temporaryRoles" :key="idx"
          >{{ role.role }}
          <a @click="handleSelectOccurrences(role)">({{ role.occurrences }})</a>
          <span v-if="idx < person.temporaryRoles.length - 1"
            >{{ ', ' }}
          </span></span
        >
      </div>
    </div>
    <span v-else>There is not yet information for this person.</span>
    <text-occurrences
      v-model="textOccurrencesDialog"
      :title="
        selectedRole
          ? `${person.display} as ${selectedRole.role}`
          : person.display
      "
      :uuids="[uuid]"
      :totalTextOccurrences="
        selectedRole ? selectedRole.occurrences : occurrencesCount
      "
      :getTexts="server.getPersonsOccurrencesTexts"
      :getTextsCount="server.getPersonsOccurrencesCounts"
      @disconnect="disconnectPerson($event)"
      :filterUuid="selectedRole ? selectedRole.roleUuid : undefined"
    />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
  watch,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { PersonInfo, PersonRole } from '@oare/types';
import TextOccurrences from '@/components/TextOccurrences/index.vue';

export default defineComponent({
  props: {
    uuid: {
      type: String,
      required: true,
    },
  },
  components: {
    TextOccurrences,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);
    const person = ref<PersonInfo>({
      person: {
        uuid: 'uuid',
        nameUuid: null,
        relation: null,
        relationNameUuid: null,
        label: '',
        descriptor: null,
      },
      display: '',
      father: null,
      mother: null,
      asshatumWives: [],
      amtumWives: [],
      husbands: [],
      siblings: [],
      children: [],
      temporaryRoles: [],
      durableRoles: [],
      discussion: [],
    });

    const getPerson = async () => {
      try {
        loading.value = true;
        person.value = await server.getPersonInfo(props.uuid);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error retrieving person info. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => await getPerson());

    watch(
      () => props.uuid,
      async () => await getPerson()
    );

    const personHasData = computed(() => {
      return (
        person.value.father ||
        person.value.mother ||
        person.value.husbands.length > 0 ||
        person.value.asshatumWives.length > 0 ||
        person.value.amtumWives.length > 0 ||
        person.value.siblings.length > 0 ||
        person.value.children.length > 0 ||
        person.value.discussion.length > 0 ||
        person.value.durableRoles.length > 0 ||
        person.value.temporaryRoles.length > 0
      );
    });

    const occurrencesLoading = ref(false);
    const occurrencesCount = ref(0);

    watch(person, async () => {
      try {
        occurrencesLoading.value = true;
        const response = await server.getPersonsOccurrencesCounts([props.uuid]);
        if (response.length > 0) {
          occurrencesCount.value = response[0].count;
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error retrieving person occurrences. Please try again.',
          err as Error
        );
      } finally {
        occurrencesLoading.value = false;
      }
    });

    const textOccurrencesDialog = ref(false);

    const disconnectPerson = async (discourseUuids: string[]) => {
      try {
        await Promise.all(
          discourseUuids.map(discourseUuid =>
            server.disconnectPersons(discourseUuid, props.uuid)
          )
        );
        occurrencesCount.value -= discourseUuids.length;
        actions.showSnackbar('Person occurrence(s) successfully disconnected');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error disconnecting person from occurrences. Please try again.',
          err as Error
        );
      }
    };

    const selectedRole = ref<PersonRole>();

    const handleSelectOccurrences = (role: PersonRole | undefined) => {
      selectedRole.value = role;
      textOccurrencesDialog.value = true;
    };

    return {
      loading,
      person,
      personHasData,
      occurrencesLoading,
      occurrencesCount,
      textOccurrencesDialog,
      server,
      disconnectPerson,
      selectedRole,
      handleSelectOccurrences,
    };
  },
});
</script>
