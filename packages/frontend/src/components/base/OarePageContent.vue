<template>
  <div v-html="content" class="title font-weight-regular"></div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    pageName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const content = ref('');

    onMounted(async () => {
      try {
        content.value = await server.getPageContent(props.pageName);
      } catch {
        actions.showErrorSnackbar(
          'Error loading page content. Please try again.'
        );
      }
    });
    return {
      content,
    };
  },
});
</script>
