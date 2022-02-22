<template>
  <OareContentView title="Publications" :loading="loading">
    <div>
      <v-btn
        v-for="(lett, lettGroup) in publicationLetterGroups"
        class="mr-2 mb-4"
        :key="lettGroup"
        fab
        small
        color="primary"
        :to="`/publications/${encodeURIComponent(lettGroup)}`"
        >{{ lettGroup }}</v-btn
      >
    </div>
    <publications-list :publications="shownPublications"></publications-list>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
} from '@vue/composition-api';
import { PublicationResponse } from '@oare/types';
import { publicationLetterGroups } from './utils';
import sl from '@/serviceLocator';
import PublicationsList from './PublicationsList.vue';

export default defineComponent({
  name: 'PublicationsView',
  components: {
    PublicationsList,
  },
  props: {
    letter: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(false);
    const publications = ref<PublicationResponse[]>([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const shownPublications = computed(() =>
      publications.value.filter(publication =>
        publicationLetterGroups[props.letter].includes(publication.prefix[0])
      )
    );

    onMounted(async () => {
      loading.value = true;
      try {
        publications.value = await server.getAllPublications();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading publications. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      publicationLetterGroups,
      loading,
      shownPublications,
      encodeURIComponent,
    };
  },
});
</script>
