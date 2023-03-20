<template>
  <OareContentView :loading="loading" :title="person.display">
    <v-row v-for="(field, idx) in person.discussion" :key="idx" class="ma-0">{{
      field.field
    }}</v-row>

    <div v-if="person.father">
      <b>Father: </b><span>{{ person.father.display }}</span>
    </div>

    <div v-if="person.mother">
      <b>Mother: </b><span>{{ person.mother.display }}</span>
    </div>

    <div v-if="person.asshatumWives.length > 0">
      <b>Aššutum Wife/Wives: </b
      ><span v-for="(wife, idx) in person.asshatumWives" :key="idx"
        >{{ wife.display }}
        <span v-if="idx < person.asshatumWives.length - 1" class="ml-n1"
          >,
        </span></span
      >
    </div>

    <div v-if="person.amtumWives.length > 0">
      <b>Amtum Wife/Wives: </b
      ><span v-for="(wife, idx) in person.amtumWives" :key="idx"
        >{{ wife.display }}
        <span v-if="idx < person.amtumWives.length - 1" class="ml-n1"
          >,
        </span></span
      >
    </div>

    <div v-if="person.husbands.length > 0">
      <b>Husband(s): </b
      ><span v-for="(husband, idx) in person.husbands" :key="idx"
        >{{ husband.display }}
        <span v-if="idx < person.husbands.length - 1" class="ml-n1"
          >,
        </span></span
      >
    </div>

    <div v-if="person.siblings.length > 0">
      <b>Sibling(s): </b
      ><span v-for="(sibling, idx) in person.siblings" :key="idx"
        >{{ sibling.display }}
        <span v-if="idx < person.siblings.length - 1" class="ml-n1"
          >,
        </span></span
      >
    </div>

    <div v-if="person.children.length > 0">
      <b>Children: </b
      ><span v-for="(child, idx) in person.children" :key="idx"
        >{{ child.display }}
        <span v-if="idx < person.children.length - 1" class="ml-n1"
          >,
        </span></span
      >
    </div>

    <div v-if="person.durableRoles.length > 0">
      <b>Durable Roles: </b
      ><span v-for="(role, idx) in person.durableRoles" :key="idx"
        >{{ role.role }}
        <span v-if="idx < person.durableRoles.length - 1" class="ml-n1"
          >,
        </span></span
      >
    </div>

    <div v-if="person.temporaryRoles.length > 0">
      <b>Other Roles: </b
      ><span v-for="(role, idx) in person.temporaryRoles" :key="idx"
        >{{ role.role }}
        <span v-if="idx < person.temporaryRoles.length - 1" class="ml-n1"
          >,
        </span></span
      >
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { PersonInfo } from '@oare/types';

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
    const person = ref<PersonInfo>();

    onMounted(async () => {
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
    });

    return {
      loading,
      person,
    };
  },
});
</script>
