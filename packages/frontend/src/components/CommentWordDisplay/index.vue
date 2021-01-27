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
    <div class="d-flex justify-center">
      <h1><slot></slot></h1>
    </div>

    <v-list>
      <v-list-item-group v-model="selectedItem" color="primary">
        <div class="d-flex flex-wrap mb-5">
          <v-list-item
            @click="
              getSelectedThreadStatus(
                threadWithComment.thread.status,
                threadWithComment.thread.uuid
              )
            "
            v-for="(threadWithComment, idx) in threadsWithComments"
            :key="idx"
            class="d-flex"
          >
            <v-list-item-title>
              {{ `Thread ${idx + 1}` }}
            </v-list-item-title>
            <v-icon v-if="selectedItem == idx">mdi-menu-up</v-icon>
            <v-icon v-else>mdi-menu-down</v-icon>
          </v-list-item>
        </div>

        <template v-if="threadsWithComments[selectedItem]">
          <v-row
            class="mb-3"
            v-for="(comment, idx) in threadsWithComments[selectedItem].comments"
            :key="idx"
          >
            <template v-if="!comment.deleted">
              <v-col cols="2">
                <span
                  >{{ comment.userLastName }}, {{ comment.userFirstName }}</span
                >
                <hr />
                <span>{{
                  new Date(comment.createdAt)
                    .toDateString()
                    .substr(
                      new Date(comment.createdAt).toDateString().indexOf(' ')
                    )
                }}</span>
              </v-col>
              <v-col cols="9">
                <v-card
                  v-if="comment.userUuid != userUuid"
                  elevation="2"
                  class="other-comments"
                >
                  <v-card-text>{{ comment.text }}</v-card-text>
                </v-card>
                <v-card v-else elevation="2" class="curr-user-comments">
                  <v-card-text>{{ comment.text }}</v-card-text>
                </v-card>
              </v-col>
              <v-col cols="1" v-if="comment.userUuid == userUuid">
                <v-btn icon @click="confirmDeleteDialog = true">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-col>
              <OareDialog
                v-if="confirmDeleteDialog"
                title="Confirm Delete"
                cancelText="No, don't delete"
                submitText="Yes, delete"
                @submit="deleteComment(comment.uuid)"
              >
                Are you sure you want to delete the comment?
              </OareDialog>
            </template>
          </v-row>
        </template>
      </v-list-item-group>
    </v-list>

    <div
      class="d-flex justify-center align-center"
      v-if="selectedItem === undefined"
    >
      <h1>
        <v-icon large color="primary">mdi-forum-outline</v-icon> Creating A New
        Thread
      </h1>
    </div>

    <v-container fluid>
      <v-textarea
        name="comment"
        label="Comment"
        auto-grow
        prepend-icon="mdi-comment"
        v-model="userComment"
      ></v-textarea>
    </v-container>

    <v-row v-if="selectedItem !== undefined">
      <v-col cols="5">
        <v-select
          v-model="selectedStatus"
          :items="statuses"
          menu-props="auto"
          label="Status"
          hide-details
          prepend-icon="mdi-google-analytics"
          single-line
        ></v-select>
      </v-col>
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  Ref,
  watch,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import {
  CommentResponse,
  Thread,
  CommentRequest,
  ThreadWithComments,
  CommentInsert,
} from '@oare/types';

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
    const confirmDeleteDialog = ref(false);
    let threadsWithComments: Ref<ThreadWithComments[]> = ref([]);
    const selectedItem = ref<number>(0);
    const selectedThreadUuid = ref<string | null>('');
    const userComment = ref('');
    const selectedStatus = ref<'New' | 'Pending' | 'In Progress' | 'Completed'>(
      'New'
    );
    const statuses = ref(['New', 'Pending', 'In Progress', 'Completed']);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const userUuid = ref<string | null>('');
    userUuid.value = store.getters.user ? store.getters.user.uuid : null;

    const getThreadsWithComments = async () => {
      try {
        if (props.uuid) {
          threadsWithComments.value = await server.getThreadsWithCommentsByReferenceUuid(
            props.uuid
          );
          if (
            selectedStatus.value == 'New' &&
            selectedThreadUuid.value == '' &&
            threadsWithComments.value[0]
          ) {
            getSelectedThreadStatus(
              threadsWithComments.value[0].thread.status,
              threadsWithComments.value[0].thread.uuid
            );
          }
        }
      } catch (e) {
        actions.showErrorSnackbar('Failed to get threads');
      }
    };

    const getSelectedThreadStatus = (
      status: 'New' | 'Pending' | 'In Progress' | 'Completed',
      threadUuid: string | null
    ) => {
      console.log(status, threadUuid);
      selectedStatus.value = status;
      selectedThreadUuid.value = threadUuid;
    };

    const updateThread = async () => {
      let threadUuid: string | null = null;
      let threadStatus = '';
      threadsWithComments.value.forEach(
        (threadWithComments: ThreadWithComments, index) => {
          if (index === selectedItem.value) {
            threadUuid = threadWithComments.thread.uuid;
            threadStatus = threadWithComments.thread.status;
          }
        }
      );

      // Only update if status changes from the original value.
      if (
        threadStatus != selectedStatus.value &&
        threadUuid == selectedThreadUuid.value
      ) {
        const thread: Thread = {
          uuid: threadUuid,
          referenceUuid: props.uuid,
          status: selectedStatus.value,
          route: props.route,
        };

        try {
          loading.value = true;
          await server.updateThread(thread);

          actions.showSnackbar('Successfully updated the thread');
          await getThreadsWithComments();
        } catch {
          actions.showErrorSnackbar('Failed to update the thread');
        } finally {
          loading.value = false;
        }
      }
    };

    const deleteComment = async (uuid: string) => {
      confirmDeleteDialog.value = false;
      try {
        loading.value = true;
        await server.deleteComment(uuid);

        actions.showSnackbar('Successfully deleted the comment');
        await getThreadsWithComments();
      } catch {
        actions.showErrorSnackbar('Failed to delete the comment');
      } finally {
        loading.value = false;
      }
    };

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

        const thread: Thread = {
          uuid:
            selectedItem.value !== undefined ? selectedThreadUuid.value : null,
          referenceUuid: props.uuid,
          status:
            selectedItem.value !== undefined ? selectedStatus.value : 'New',
          route: props.route,
        };

        const request: CommentRequest = { comment, thread };

        const response: CommentResponse = await server.insertComment(request);
        if (response) {
          actions.showSnackbar(
            `Successfully added the comment for ${props.word}`
          );
          userComment.value = '';
          await getThreadsWithComments();
        } else {
          actions.showErrorSnackbar('Failed to insert the comment');
        }
      } catch {
        actions.showErrorSnackbar('Failed to insert the comment');
      } finally {
        loading.value = false;
      }
    };

    watch(() => selectedStatus.value, updateThread);

    onMounted(getThreadsWithComments);

    return {
      confirmDeleteDialog,
      statuses,
      selectedStatus,
      userUuid,
      threadsWithComments,
      selectedItem,
      getSelectedThreadStatus,
      deleteComment,
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
