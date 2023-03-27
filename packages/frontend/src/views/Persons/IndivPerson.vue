<template>
  <OareContentView :loading="loading" :title="person.display">
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

      <div v-if="personRoles.durableRoles.length > 0">
        <b>Durable Roles: </b
        ><span v-for="(role, idx) in personRoles.durableRoles" :key="idx"
          >{{ role.role }} ({{ role.occurrences }})
          <span v-if="idx < personRoles.durableRoles.length - 1" class="ml-n1"
            >,
          </span></span
        >
      </div>

      <div v-if="personRoles.temporaryRoles.length > 0">
        <b>Temporary Roles: </b
        ><span v-for="(role, idx) in personRoles.temporaryRoles" :key="idx"
          >{{ role.role }} ({{ role.occurrences }})
          <span v-if="idx < personRoles.temporaryRoles.length - 1" class="ml-n1"
            >,
          </span></span
        >
      </div>
    </div>
    <span v-else>There is not yet information for this person.</span>
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
import { PersonInfo, PersonRoleResponse } from '@oare/types';

export default defineComponent({
  props: {
    uuid: {
      type: String,
      required: true,
    },
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
      discussion: [],
    });
    const personRoles = ref<PersonRoleResponse>({
      durableRoles: [],
      temporaryRoles: [],
    });

    const getPerson = async () => {
      try {
        loading.value = true;
        person.value = await server.getPersonInfo(props.uuid);
        personRoles.value = await server.getPersonRoles(props.uuid);
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
        personRoles.value.durableRoles.length > 0 ||
        personRoles.value.temporaryRoles.length > 0
      );
    });

    return {
      loading,
      person,
      personRoles,
      personHasData,
    };
  },
});
</script>
