<template>
  <oare-dialog
    :value="value"
    @submit="insertComment"
    @input="$emit('input', $event)"
    :width="1000"
    :show-submit="true"
    :show-cancel="true"
    :closeButton="true"
    :persistent="false"
  >

    <div class='d-flex justify-center'>
      <h1><slot></slot></h1>
    </div>

      <v-list>
        <v-list-item-group
                v-model="selectedItem"
                color="primary"
        >
          <div class='d-flex flex-wrap'>
            <v-list-item v-for='(threadWithComment, idx) in threadsWithComments' :key='idx' class='d-flex'
            >
              <v-list-item-title>
                {{`Thread ${idx}`}}
              </v-list-item-title>
              <v-icon v-if='selectedItem == idx'>mdi-menu-up</v-icon>
              <v-icon v-else>mdi-menu-down</v-icon>
            </v-list-item>
          </div>

          <template v-if='threadsWithComments[selectedItem]'>
            <div class='d-flex flex-row mb-3' v-for='(comment, idx) in threadsWithComments[selectedItem].comments' :key='idx'>
              <template v-if='!comment.deleted'>
                  <div class='d-flex flex-column'>
                    <span class='mr-5'>{{comment.userLastName}}, {{comment.userFirstName}}</span>
                    <span>{{new Date(comment.createdAt).toDateString()}}</span>
                  </div>
                <div class='d-flex flex-row flex-grow-1'>
                  <v-card v-if='comment.userUuid != userUuid'
                          elevation='2'
                          class='other-comments'>
                    <v-card-text>{{comment.text}}</v-card-text>
                  </v-card>
                  <v-card v-else
                          elevation='2'
                          class='curr-user-comments'>
                    <v-card-text>{{comment.text}}</v-card-text>
                  </v-card>
                </div>
              </template>
            </div>
          </template>
        </v-list-item-group>
      </v-list>
    <v-container fluid>
          <v-textarea
            name="comment"
            label="Comment"
            auto-grow
            prepend-icon="mdi-comment"
            v-model="userComment"
          ></v-textarea>
        </v-container>
  </oare-dialog>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, Ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
  import { CommentResponse, Thread, CommentRequest, ThreadWithComments, CommentInsert } from '@oare/types';

export default defineComponent({
  name: 'DictionaryWordDisplay',
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
  },
  setup(props, { emit }) {
    const loading = ref(false);
    let threadsWithComments: Ref<ThreadWithComments[]> = ref([]);
    const selectedItem = ref<number>(0);
    const userComment = ref('');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const userUuid = ref<string|null>('');
    userUuid.value = store.getters.user ? store.getters.user.uuid : null

    const getThreadsWithComments = async () => {
              try {
                threadsWithComments.value = await server.getThreadsWithCommentsByReferenceUuid(props.uuid);
              } catch {
                actions.showErrorSnackbar('Failed to get threads');
              }
    }

    const insertComment = async () => {
      if (store.getters.user === null) {
        actions.showErrorSnackbar('Please login before making a comment.');
        return;
      }

      if (!userComment.value) {
        actions.showErrorSnackbar('Please enter a comment.');
        return;
      }

      loading.value = true;
      try {
        const comment: CommentInsert = {
          uuid: null,
          threadUuid: null,
          userUuid: store.getters.user ? store.getters.user.uuid : null,
          createdAt: null,
          deleted: false,
          text: userComment.value,
        };

        let threadUuid: string | null = null;
        let threadStatus: 'New' | 'Pending' | 'In Progress' | 'Completed' = 'New';
        threadsWithComments.value.forEach((threadWithComments: ThreadWithComments, index) => {
          if (index === selectedItem.value) {
            threadUuid = threadWithComments.thread.uuid
            threadStatus = threadWithComments.thread.status;
          }
        })
        
        const thread: Thread = {
          uuid: threadUuid,
          referenceUuid: props.uuid,
          status: threadStatus,
          route: props.route,
        };
        const request: CommentRequest = { comment, thread };

        const response: CommentResponse = await server.insertComment(request);
        if (response) {
          // Remove <em> tags if embedded html is used.
          actions.showSnackbar(
            `Successfully added the comment for ${props.word}`
          );
          userComment.value = '';
          await getThreadsWithComments();
          emit('submit');
        } else {
          actions.showErrorSnackbar('Failed to insert the comment');
        }
      } catch {
        actions.showErrorSnackbar('Failed to insert the comment');
      } finally {
        loading.value = false;
      }
    };

    onMounted(getThreadsWithComments);

    return {
      userUuid,
      threadsWithComments,
      selectedItem,
      insertComment,
      userComment,
    };
  },
});
</script>

<style scoped>
  .other-comments {
    border-radius: 0 10px 10px 10px !important;
  }
  .curr-user-comments {
    border-radius: 10px 0 10px 10px !important;
    background-color: #fafafa !important;
  }
</style>
