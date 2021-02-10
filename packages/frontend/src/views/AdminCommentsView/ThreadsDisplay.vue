<template>
  <div class="ma-5">
    <h2>Comments</h2>

    <div class='ma-5'>
      <div v-for="(threadsCollection, word) in groupedByThreads" :key="word">
        <h2>{{capitalizeFirstLetter(word)}}</h2>
        <v-divider></v-divider>
        <div v-for='(thread, idx) in threadsCollection' :key='idx' class=''>
          <v-hover v-slot='{ hover }'>
            <v-card :elevation='hover ? 5 : 50' class='pl-3 pr-3 pt-1 pb-1 ma-2'>
              <v-row>
                <v-col cols='1'>Thread {{idx}}</v-col>
                <v-col cols='2'>({{thread.status}})</v-col>
                <v-col cols='9'>{{shortenComment(thread.latestComment)}}</v-col>
              </v-row>
            </v-card>
          </v-hover>


<!--          <h3>Thread {{idx}} - ({{thread.status}}): {{thread.latestComment}}</h3>-->
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, onUpdated, PropType, ref, watch } from '@vue/composition-api';
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
    const groupThreadsByWord = () => {
      return props.threads.reduce((map: Record<string, ThreadDisplay[]>, thread: ThreadDisplay) => {
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

    const capitalizeFirstLetter = (word: string) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    const shortenComment = (text: string) => {
      return text.length > 120 ? text.substr(0, 120) + '. . .' : text;
    }
    const groupedByThreads = computed(() => props.threads ? groupThreadsByWord() : []);

    return {
      groupedByThreads,
      capitalizeFirstLetter,
      shortenComment,
    };
  },
});
</script>
