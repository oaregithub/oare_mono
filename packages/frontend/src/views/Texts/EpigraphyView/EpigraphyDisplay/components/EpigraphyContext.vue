<template>
  <div>
    <v-progress-circular v-if="loading" indeterminate />
    <div v-else>
      <div v-if="textOccurrence.length > 0">
        <div class="py-1">
          <router-link
            v-if="textOccurrence.length > 0"
            :to="`/epigraphies/${textOccurrence[0].textUuid}/${
              textOccurrence[0].discoursesToHighlight ||
              textOccurrence[0].discourseUuid
            }`"
            class="test-text"
            target="_blank"
            >{{ textOccurrence[0].textName }}</router-link
          >
        </div>
        <div
          v-for="(reading, index) in textOccurrence[0].readings"
          class="test-reading"
          :key="index"
          v-html="reading"
        />
      </div>
      <span v-else v-html="'n/a'"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import { TextOccurrencesResponseRow } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    spellingUuid: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');

    const textOccurrence = ref<TextOccurrencesResponseRow[]>([]);
    const loading = ref(false);

    onMounted(async () => {
      try {
        loading.value = true;
        textOccurrence.value = await server.getSpellingOccurrencesTexts(
          [props.spellingUuid],
          {
            page: 1,
            limit: 1,
          }
        );
        loading.value = false;
      } catch (err) {
        actions.showErrorSnackbar('Failed on mount', err as Error);
      }
    });

    return {
      textOccurrence,
      loading,
    };
  },
});
</script>
