<template>
  <div class="ma-5">
    <h2>Comments</h2>

    <div v-for="(thread, idx) in threads" :key="idx">
      <h1>{{ thread }}</h1>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, PropType, ref } from '@vue/composition-api';
import { ThreadDisplay } from '@oare/types/build/src/comments';

export default defineComponent({
  name: 'ThreadsDisplay',
  props: {
    threads: {
      type: Array as PropType<ThreadDisplay[]>,
      required: true,
    },
  },

  setup(props) {
    const groupedByThreads = ref<Record<string, ThreadDisplay[]>>({});

    const groupThreadsByWord = () => {
      groupedByThreads.value = props.threads.reduce((map: Record<string, ThreadDisplay[]>, thread: ThreadDisplay) => {
        if (map[thread.word] === undefined) {
          map[thread.word] = [thread];
        } else {
          const returnObjs = map[thread.word];
          returnObjs.push(thread);
          map[thread.word] = returnObjs;
        }
        return map;
      }, {});
    }

    onMounted(groupThreadsByWord)

    return {};
  },
});
</script>
