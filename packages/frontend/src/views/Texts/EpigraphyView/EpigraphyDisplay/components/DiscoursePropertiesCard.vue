<template>
  <v-card v-if="displayCard" class="pa-4">
    <div v-if="properties && properties.properties.length > 0">
      <h3>Properties</h3>
      <v-divider class="mb-2" />
      <property-card-unit
        v-for="(property, idx) in properties.properties"
        :key="idx"
        :property="property"
      />
    </div>
    <div v-if="properties && properties.notes.length > 0" class="mt-4">
      <h3>Notes</h3>
      <v-divider class="mb-2" />
      <div v-for="(note, idx) in properties.notes" :key="idx">
        {{ note.content }}
      </div>
    </div>
  </v-card>
  <v-card v-else class="pa-4">
    No property information is available for this discourse unit.
  </v-card>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
} from '@vue/composition-api';
import { DiscourseProperties } from '@oare/types';
import sl from '@/serviceLocator';
import PropertyCardUnit from './PropertyCardUnit.vue';

export default defineComponent({
  name: 'DiscoursePropertiesCard',
  props: {
    discourseUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    PropertyCardUnit,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const properties = ref<DiscourseProperties>();

    const displayCard = computed(() => {
      const hasProperties =
        properties.value && properties.value.properties.length > 0;
      const hasNotes = properties.value && properties.value.notes.length > 0;

      return hasProperties || hasNotes;
    });

    onMounted(async () => {
      try {
        properties.value = await server.getDiscourseProperties(
          props.discourseUuid
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading discourse properties',
          err as Error
        );
      }
    });

    return {
      properties,
      displayCard,
    };
  },
});
</script>