<template>
  <oare-dialog
    :actionTitle="'Add Comment'"
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
        <v-card
          :color="
            threadWithComment.thread.uuid ===
            selectedThreadWithComments.thread.uuid
              ? '#fafafa'
              : '#ffffff'
          "
          :key="idx"
          elevation="0"
          v-for="(threadWithComment, idx) in threadsWithComments"
        >
          <div class="pl-2 pr-2">
            <v-row @click="setSelectedThreadWithComment(threadWithComment)">
              <v-col cols="9">
                <h2>
                  {{ displayThreadName(threadWithComment.thread.name, idx) }}
                </h2>
              </v-col>
              <v-col cols="1">
                <v-icon
                  @click="
                    openEditThreadDialog(
                      displayThreadName(threadWithComment.thread.name, idx)
                    )
                  "
                  class="mb-n2"
                  color="primary"
                  >mdi-pencil</v-icon
                >
              </v-col>
            </v-row>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <div class="mt-n3">
                  <span class="text-subtitle-2">{{
                    threadWithComment.thread.status
                  }}</span>
                  <v-icon
                    @click="setSelectedThreadWithComment(threadWithComment)"
                    class="mt-n1 test-status-dropdown"
                    v-bind="attrs"
                    v-if="loggedInUser && loggedInUser.isAdmin"
                    v-on="on"
                    >mdi-chevron-down</v-icon
                  >
                </div>
              </template>
              <v-list>
                <v-list-item
                  class="test-status-dropdown-item"
                  :key="index"
                  @click="updateThreadStatus(status)"
                  v-for="(status, index) in statuses"
                >
                  <v-list-item-title>{{ status }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <v-divider />
        </v-card>
        <div
          class="flex justify-center align-content-center mt-5"
          v-if="selectedThreadWithComments.thread.uuid !== null"
        >
          <v-btn
            @click="selectedThreadWithComments.thread.uuid = null"
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
        <template
          v-if="
            selectedThreadWithComments.thread &&
            selectedThreadWithComments.thread.uuid !== null
          "
        >
          <v-row
            :key="idx"
            class="mb-3"
            v-for="(comment, idx) in selectedThreadWithComments.comments"
          >
            <v-col
              align="center"
              cols="3"
              justify="center"
              v-if="loggedInUser && loggedInUser.uuid !== comment.userUuid"
            >
              <span class="text--primary" v-if="comment.userUuid"
                >{{ comment.userFirstName }} {{ comment.userLastName }}</span
              >
              <span class="text--primary" v-else>Administrator</span>
              <hr class="primary" />
              <span class="text--primary">{{
                formatCommentDateTime(comment.createdAt)
              }}</span>
            </v-col>
            <v-col cols="8">
              <v-card class="rounded-lg" color="#fafafa" elevation="1" outlined>
                <v-card-text v-if="!comment.deleted">{{
                  comment.text
                }}</v-card-text>
                <v-card-text class="font-weight-bold" v-else>
                  <v-icon>mdi-comment-remove</v-icon> This comment has been
                  deleted.</v-card-text
                >
              </v-card>
            </v-col>
            <v-col
              align="center"
              cols="3"
              justify="center"
              v-if="loggedInUser && loggedInUser.uuid === comment.userUuid"
            >
              <span class="text--primary" v-if="comment.userUuid"
                >{{ comment.userFirstName }} {{ comment.userLastName }}</span
              >
              <span class="text--primary" v-else>Administrator</span>
              <hr class="primary" />
              <span class="text--primary">{{
                formatCommentDateTime(comment.createdAt)
              }}</span>
            </v-col>
            <v-col class="pr-2" cols="1" v-if="canDeleteComment(comment)">
              <v-btn @click="setDeleteValues(comment.uuid)" icon>
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </template>
        <div
          class="flex-column d-flex justify-center align-center no-thread-selected-display"
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
              class="pa-0"
              counter="1000"
              label="Add comment..."
              outlined
              rows="1"
              v-model="userComment"
            ></v-textarea>
          </v-col>
          <v-col cols="1" class="ml-n3">
            <v-btn
              :disabled="userComment === ''"
              @click="insertComment"
              class="mb-n7"
              icon
            >
              <v-icon color="primary">mdi-send</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <OareDialog
      @submit="deleteComment()"
      cancelText="No, don't delete"
      submitText="Yes, delete"
      title="Confirm Delete"
      v-model="confirmDeleteDialog"
    >
      Are you sure you want to delete the comment?
    </OareDialog>
    <OareDialog
      @input="editedThreadValue = ''"
      @submit="editThreadName()"
      cancelText="Cancel"
      submitText="Submit"
      title="Edit"
      v-model="confirmEditThreadNameDialog"
    >
      <v-text-field
        label="New Thread Name"
        v-model="editedThreadValue"
      ></v-text-field>
      <span class="error--text" v-if="!validateThreadName()">{{
        editErrorMessage
      }}</span>
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
  CommentDisplay,
  UpdateThreadNameRequest,
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
    const confirmEditThreadNameDialog = ref(false);
    const editedThreadValue = ref('');
    const editErrorMessage = ref('');
    const threadsWithComments: Ref<ThreadWithComments[]> = ref([]);
    const selectedThreadWithComments = ref<ThreadWithComments>({
      thread: {
        uuid: null,
        name: null,
        referenceUuid: '',
        status: 'New',
        route: '',
      },
      comments: [],
    });
    const selectedItem = ref<number | undefined>(undefined);
    const selectedCommentUuidToDelete = ref<string>('');
    const userComment = ref('');
    const statuses = ref(['New', 'Pending', 'In Progress', 'Completed']);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const displayThreadName = (threadName: string | null, idx: number) => {
      return threadName ? threadName : `Untitled ${idx}`;
    };

    const formatCommentDateTime = (datetime: string): string => {
      return new Date(datetime)
        .toDateString()
        .substr(new Date(datetime).toDateString().indexOf(' '));
    };

    const canDeleteComment = (comment: CommentDisplay) => {
      return (
        loggedInUser.value &&
        (comment.userUuid === loggedInUser.value.uuid ||
          loggedInUser.value.isAdmin) &&
        comment.userUuid !== null &&
        !comment.deleted
      );
    };

    const findAndSetSelectedThread = (
      newThreadsWithComments: ThreadWithComments[]
    ) => {
      if (selectedThreadWithComments.value) {
        newThreadsWithComments.forEach(threadWithComments => {
          if (
            threadWithComments.thread.uuid ===
            selectedThreadWithComments.value.thread.uuid
          ) {
            setSelectedThreadWithComment(threadWithComments);
          }
        });
      }
    };

    const openEditThreadDialog = (displayedThreadName: string) => {
      confirmEditThreadNameDialog.value = true;
      editedThreadValue.value = displayedThreadName;
    };

    const validateThreadName = () => {
      let valid = true;
      if (editedThreadValue.value === '') {
        editErrorMessage.value = 'Cannot be empty.';
        valid = false;
      } else if (
        editedThreadValue.value === selectedThreadWithComments.value.thread.name
      ) {
        editErrorMessage.value = 'Cannot have the same name.';
        valid = false;
      } else {
        threadsWithComments.value.forEach(threadWithComment => {
          if (threadWithComment.thread.name === editedThreadValue.value) {
            editErrorMessage.value =
              'Cannot have the same name as another thread.';
            valid = false;
          }
        });
      }

      return valid;
    };

    const getThreadsWithComments = async () => {
      try {
        if (props.uuid) {
          loading.value = true;
          threadsWithComments.value = await server.getThreadsWithCommentsByReferenceUuid(
            props.uuid
          );
          findAndSetSelectedThread(threadsWithComments.value);
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

    const setSelectedThreadWithComment = (
      threadWithComment: ThreadWithComments
    ) => {
      selectedThreadWithComments.value = threadWithComment;
    };

    const updateThreadStatus = async (status: ThreadStatus) => {
      // Only update if status changes from the original value.
      if (status !== selectedThreadWithComments.value.thread.status) {
        try {
          loading.value = true;
          selectedThreadWithComments.value.thread.status = status;
          await server.updateThread(selectedThreadWithComments.value.thread);

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
          threadUuid: selectedThreadWithComments.value.thread.uuid
            ? selectedThreadWithComments.value.thread.uuid
            : null,
          userUuid: loggedInUser.value ? loggedInUser.value.uuid : null,
          createdAt: null,
          deleted: false,
          text: userComment.value,
        };

        // If creating new thread
        if (selectedThreadWithComments.value.thread.uuid === null) {
          selectedThreadWithComments.value.thread = {
            uuid: null,
            name: null,
            referenceUuid: props.uuid,
            status: 'New',
            route: props.route,
          };
        }

        const request: CommentRequest = {
          comment,
          thread: selectedThreadWithComments.value.thread,
        };

        const response: CommentResponse = await server.insertComment(request);
        if (response) {
          actions.showSnackbar(
            `Successfully added the comment for ${props.word}`
          );
          userComment.value = '';
          selectedThreadWithComments.value.thread.uuid = response.threadUuid;
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

    const editThreadName = async () => {
      if (!validateThreadName()) {
        actions.showErrorSnackbar('Invalid Thread Name');
        return;
      }

      if (selectedThreadWithComments.value.thread.uuid === null) {
        actions.showErrorSnackbar('Thread has not been selected');
        return;
      }

      confirmEditThreadNameDialog.value = false;

      const request: UpdateThreadNameRequest = {
        threadUuid: selectedThreadWithComments.value.thread.uuid,
        newName: editedThreadValue.value,
      };

      loading.value = true;
      try {
        await server.updateThreadName(request);
        actions.showSnackbar(`Successfully edited the thread name.`);
        await getThreadsWithComments();
      } catch {
        actions.showErrorSnackbar('Failed to edit thread name');
      } finally {
        loading.value = false;
        editedThreadValue.value = '';
      }
    };

    onMounted(getThreadsWithComments);

    const loggedInUser = computed(() =>
      store.getters.user ? store.getters.user : null
    );

    return {
      displayThreadName,
      formatCommentDateTime,
      canDeleteComment,
      updateThreadStatus,
      openEditThreadDialog,
      validateThreadName,
      editErrorMessage,
      editedThreadValue,
      editThreadName,
      confirmEditThreadNameDialog,
      setSelectedThreadWithComment,
      selectedThreadWithComments,
      loading,
      selectedCommentUuidToDelete,
      confirmDeleteDialog,
      statuses,
      loggedInUser,
      threadsWithComments,
      selectedItem,
      setDeleteValues,
      deleteComment,
      insertComment,
      userComment,
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
