<template>
		<ThreadsDisplay :threads='["Hello", "My", "Friend"]'></ThreadsDisplay>
</template>

<script lang="ts">
import {
defineComponent,
} from '@vue/composition-api';
import ThreadsDisplay from '@/views/AdminCommentsView/ThreadsDisplay.vue';


export default defineComponent({
  name: 'AdminCommentsView',
  components: {
    ThreadsDisplay,
  },
});

</script>
