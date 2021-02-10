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
    :submitLoading="loading"
  >
    <v-row>
      <v-col cols="10">
        <h1><slot></slot></h1>
      </v-col>
      <v-col>
        <v-btn @click="selectedItem = undefined" color="primary"
          >Add Thread</v-btn
        >
      </v-col>
    </v-row>

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
            style="max-width: 33%"
          >
            <v-list-item-title>
              {{ `Thread ${idx + 1} (${threadWithComment.thread.status})` }}
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
                <span v-if="comment.userUuid"
                  >{{ comment.userLastName }}, {{ comment.userFirstName }}</span
                >
                <span v-else>Administrator</span>
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
                  v-if="comment.userUuid !== loggedInUser.uuid"
                  elevation="2"
                  class="rounded-lg"
                >
                  <v-card-text>{{ comment.text }}</v-card-text>
                </v-card>
                <v-card v-else elevation="2" class="rounded-lg" color="#fafafa">
                  <v-card-text>{{ comment.text }}</v-card-text>
                </v-card>
              </v-col>
              <v-col
                cols="1"
                v-if="
                  comment.userUuid === loggedInUser.uuid || loggedInUser.isAdmin
                "
              >
                <v-btn icon @click="setDeleteValues(comment.uuid)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-col>
            </template>
          </v-row>
        </template>
      </v-list-item-group>
    </v-list>

    <div
      class="d-flex justify-center align-center"
      v-if="selectedItem === undefined || !threadsWithComments.length"
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
        counter="1000"
      ></v-textarea>
    </v-container>

    <v-row
      v-if="
        selectedItem !== undefined &&
          threadsWithComments.length &&
          loggedInUser.isAdmin
      "
    >
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

    <OareDialog
      v-model="confirmDeleteDialog"
      title="Confirm Delete"
      cancelText="No, don't delete"
      submitText="Yes, delete"
      @submit="deleteComment()"
    >
      Are you sure you want to delete the comment?
    </OareDialog>
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
import {
  CommentResponse,
  Thread,
  CommentRequest,
  ThreadWithComments,
  CommentInsert,
  ThreadStatus,
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
  setup(props) {
    const loading = ref(false);
    const confirmDeleteDialog = ref(false);
    const threadsWithComments: Ref<ThreadWithComments[]> = ref([]);
    const selectedItem = ref<number | undefined>(undefined);
    const selectedThreadUuid = ref<string | null>('');
    const selectedCommentUuidToDelete = ref<string>('');
    const userComment = ref('');
    const selectedStatus = ref<ThreadStatus>('New');
    const statuses = ref(['New', 'Pending', 'In Progress', 'Completed']);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const getThreadsWithComments = async () => {
      try {
        if (props.uuid) {
          loading.value = true;
          threadsWithComments.value = await server.getThreadsWithCommentsByReferenceUuid(
            props.uuid
          );
        }
      } catch (e) {
        actions.showErrorSnackbar('Failed to get threads');
      } finally {
        loading.value = false;
      }
    };

    const setDeleteValues = (commentUuid: string) => {
      selectedCommentUuidToDelete.value = commentUuid;
      confirmDeleteDialog.value = true;
    };

    const getSelectedThreadStatus = (
      status: ThreadStatus,
      threadUuid: string | null
    ) => {
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
        threadStatus !== selectedStatus.value &&
        threadUuid === selectedThreadUuid.value
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

    const deleteComment = async () => {
      confirmDeleteDialog.value = false;
      try {
        loading.value = true;
        await server.deleteComment(selectedCommentUuidToDelete.value);

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

      if (userComment.value.length > 1000) {
        actions.showErrorSnackbar(
          'Character count exceeded, please shorten the comment.'
        );
        return;
      }

      loading.value = true;
      try {
        const comment: CommentInsert = {
          uuid: null,
          threadUuid:
            selectedItem.value !== undefined ? selectedThreadUuid.value : null,
          userUuid: loggedInUser.value ? loggedInUser.value.uuid : null,
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
        userComment.value = '';
      }
    };

    watch(() => selectedStatus.value, updateThread);

    onMounted(getThreadsWithComments);

    const loggedInUser = computed(() =>
      store.getters.user ? store.getters.user : null
    );

    return {
      loading,
      selectedCommentUuidToDelete,
      confirmDeleteDialog,
      statuses,
      selectedStatus,
      loggedInUser,
      threadsWithComments,
      selectedItem,
      setDeleteValues,
      getSelectedThreadStatus,
      deleteComment,
      insertComment,
      userComment,
    };
  },
});
</script>
