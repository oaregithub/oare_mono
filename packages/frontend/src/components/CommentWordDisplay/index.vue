<template>
  <oare-dialog
    actionTitle="Add Comment"
    :closeButton="true"
    :persistent="false"
    :show-cancel="false"
    :show-submit="false"
    :submitLoading="loading"
    :value="value"
    :width="1000"
    @input="$emit('input', $event)"
  >
    <v-row>
      <v-col cols="10">
        <h1 class="text-capitalize text--primary"><slot></slot></h1>
      </v-col>
    </v-row>
    <v-row class="comment-display-height">
      <v-col class="overflow-y-auto comment-display-height" cols="3">
        <h2 class="mb-3 text--primary">Threads</h2>
        <v-divider />
        <ThreadListItem
          v-for="(thread, index) in threadsWithComments"
          :key="index"
          :thread="thread"
          :isSelected="selectedThread && selectedThread.uuid === thread.uuid"
          @selected="setSelectedThread(index)"
          @statusUpdated="getThreadsWithComments"
          @nameUpdated="updateThreadName(index, $event)"
        />
        <div
          class="flex justify-center align-content-center mt-5"
          v-if="selectedThread && selectedThread.uuid"
        >
          <v-btn
            @click="selectedThreadIndex = -1"
            color="#ffffff"
            elevation="0"
          >
            <v-icon color="primary">mdi-plus</v-icon>
            <h3 class="text--primary">Add Thread</h3>
          </v-btn>
        </div>
      </v-col>
      <v-divider class="mr-5 ml-5" vertical />
      <v-col class="overflow-y-auto comment-display-height" cols="8">
        <h2 class="mb-3 text--primary">Comments</h2>
        <template v-if="selectedThread">
          <CommentItem
            :key="comment.uuid"
            class="mb-3"
            v-for="(comment, idx) in selectedThread.comments"
            :comment="comment"
            @deleted="deleteComment(idx)"
          />
        </template>
        <div
          class="
            flex-column
            d-flex
            justify-center
            align-center
            no-thread-selected-display
          "
          v-else
        >
          <h1>
            <v-icon color="primary" large>mdi-forum-outline</v-icon> Please
            select a thread to view comments
          </h1>
          <h2 class="mb-10 mt-10">OR</h2>
          <h1>
            <v-icon class="mt-n2" color="primary" large>mdi-plus-circle</v-icon
            >Add a comment to start a new thread
          </h1>
        </div>
        <v-row>
          <v-col cols="11">
            <v-textarea
              autofocus
              auto-grow
              class="pa-0 test-comment"
              counter="1000"
              label="Add comment..."
              outlined
              rows="1"
              v-model="userComment"
              @keydown.meta.enter="insertComment"
              @keydown.ctrl.enter="insertComment"
            ></v-textarea>
          </v-col>
          <v-col cols="1" class="ml-n3">
            <v-btn
              :disabled="userComment === ''"
              @click="insertComment"
              class="mb-n7 test-insert-comment"
              icon
            >
              <v-icon color="primary">mdi-send</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <div
      v-if="initialThreadUuid && dictionaryWordUuid"
      class="test-comment-footer"
    >
      <v-divider class="mt-3 mb-3" />
      <component
        v-if="showDictionary"
        :is="dictionaryWordComponent"
        :uuid="dictionaryWordUuid"
        :uuid-to-highlight="
          selectedThread ? selectedThread.referenceUuid : null
        "
        :allow-commenting="false"
        :allow-editing="false"
        :allow-breadcrumbs="false"
      >
      </component>
    </div>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  Ref,
  watch,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { ThreadWithComments } from '@oare/types';

import CommentItem from './CommentItem.vue';
import ThreadListItem from './ThreadListItem.vue';

export default defineComponent({
  name: 'CommentWordDisplay',
  components: {
    CommentItem,
    ThreadListItem,
  },
  props: {
    word: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
    uuid: {
      type: String,
      required: true,
    },
    value: {
      type: Boolean,
      default: true,
    },
    initialThreadUuid: {
      type: String,
      default: null,
    },
    showDictionary: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const dictionaryWordUuid = ref('');
    const loading = ref(false);
    const threadsWithComments: Ref<ThreadWithComments[]> = ref([]);
    const selectedThreadIndex = ref(-1);

    const selectedThread = computed(() =>
      selectedThreadIndex.value >= 0
        ? threadsWithComments.value[selectedThreadIndex.value]
        : null
    );

    const userComment = ref('');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const setSelectedThread = (index: number) => {
      selectedThreadIndex.value = index;
    };

    const updateThreadName = (index: number, newThreadName: string) => {
      threadsWithComments.value[index].name = newThreadName;
    };

    const getThreadsWithComments = async () => {
      try {
        if (props.uuid) {
          loading.value = true;
          const threads = await server.getThreadsWithCommentsByReferenceUuid(
            props.uuid
          );

          threadsWithComments.value = threads;
          if (selectedThreadIndex.value === -1 && threads.length > 0) {
            selectedThreadIndex.value = 0;
          }
        }
      } catch (err) {
        actions.showErrorSnackbar('Failed to get threads', err as Error);
      } finally {
        loading.value = false;
      }
    };

    const deleteComment = (index: number) => {
      threadsWithComments.value[selectedThreadIndex.value].comments[
        index
      ].deleted = true;
    };

    const validateComment = () => {
      if (!store.getters.user) {
        actions.showErrorSnackbar('Please log in before making a comment.');
        return false;
      }
      if (userComment.value.length > 1000) {
        actions.showErrorSnackbar(
          'Character count exceeded, please shorten the comment.'
        );
        return false;
      }

      if (userComment.value === '') {
        return false;
      }

      return true;
    };

    const insertComment = async () => {
      if (!validateComment()) {
        return;
      }

      loading.value = true;
      try {
        // If creating new thread
        let threadUuid: string;
        let isNewThread = false;
        const createThreadPayload = {
          referenceUuid: props.uuid,
          route: props.route,
        };
        if (!selectedThread.value) {
          threadUuid = await server.createThread(createThreadPayload);
          isNewThread = true;
        } else {
          threadUuid = selectedThread.value.uuid;
        }

        await server.insertComment({
          threadUuid,
          text: userComment.value,
        });

        await getThreadsWithComments();

        actions.showSnackbar(
          `Successfully added the comment for ${props.word}`
        );
        userComment.value = '';

        if (isNewThread) {
          selectedThreadIndex.value = threadsWithComments.value.length - 1;
        }
      } catch (err) {
        actions.showErrorSnackbar('Failed to insert the comment', err as Error);
      } finally {
        loading.value = false;
        userComment.value = '';
      }
    };

    onMounted(async () => {
      try {
        await getThreadsWithComments();

        if (props.initialThreadUuid) {
          selectedThreadIndex.value = threadsWithComments.value.findIndex(
            thread => thread.uuid === props.initialThreadUuid
          );
        }
      } catch (err) {
        actions.showErrorSnackbar('Failed to get threads', err as Error);
      }
    });

    const loggedInUser = computed(() =>
      store.getters.user ? store.getters.user : null
    );

    watch(
      selectedThread,
      () => {
        if (selectedThread.value) {
          dictionaryWordUuid.value = selectedThread.value.route.substr(
            selectedThread.value.route.indexOf('/', 2) + 1
          );
        }
      },
      {
        immediate: false,
        deep: true,
      }
    );

    const dictionaryWordComponent = computed(() =>
      props.showDictionary
        ? () => import('@/views/DictionaryWord/index.vue')
        : null
    );

    return {
      dictionaryWordUuid,
      selectedThread,
      loading,
      loggedInUser,
      threadsWithComments,
      insertComment,
      userComment,
      dictionaryWordComponent,
      selectedThreadIndex,
      console,
      setSelectedThread,
      getThreadsWithComments,
      deleteComment,
      updateThreadName,
    };
  },
});
</script>

<style scoped>
.comment-display-height {
  height: 500px;
}
.no-thread-selected-display {
  height: 80%;
  width: 100%;
}
.cursor-display {
  cursor: pointer;
}
</style>
