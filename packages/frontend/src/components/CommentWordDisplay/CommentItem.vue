<template>
  <div>
    <v-row>
      <v-col align="center" cols="3" justify="center">
        <span class="text--primary test-comment-author"
          >{{ comment.userFirstName }} {{ comment.userLastName }}</span
        >
        <hr class="primary" />
        <span class="text--primary">{{
          formatTimestamp(comment.createdAt)
        }}</span>
      </v-col>
      <v-col cols="8">
        <v-card
          class="rounded-lg test-comment-text"
          color="#fafafa"
          elevation="1"
          outlined
        >
          <v-card-text v-if="!comment.deleted">{{ comment.text }}</v-card-text>
          <v-card-text class="font-weight-bold" v-else>
            <v-icon>mdi-comment-remove</v-icon>
            This comment has been deleted.
          </v-card-text>
        </v-card>
      </v-col>
      <v-col class="pr-2" cols="1" v-if="canDeleteComment">
        <v-btn
          class="test-delete-comment"
          @click="confirmDeleteDialog = true"
          icon
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <OareDialog
      class="test-delete-dialog"
      @submit="deleteComment"
      cancelText="No, don't delete"
      submitText="Yes, delete"
      title="Confirm Delete"
      v-model="confirmDeleteDialog"
      :submitLoading="loading"
    >
      Are you sure you want to delete the comment?
    </OareDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { CommentDisplay } from '@oare/types';
import sl from '@/serviceLocator';
import { formatTimestamp } from '@/utils';

export default defineComponent({
  props: {
    comment: {
      type: Object as PropType<CommentDisplay>,
      required: true,
    },
  },
  setup({ comment }, { emit }) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const confirmDeleteDialog = ref(false);
    const loading = ref(false);

    const canDeleteComment = computed(() => {
      const user = store.getters.user;

      if (!user) {
        return false;
      }

      if (comment.deleted) {
        return false;
      }

      return comment.userUuid === user.uuid || user.isAdmin;
    });

    const deleteComment = async () => {
      try {
        loading.value = true;
        await server.deleteComment(comment.uuid);

        actions.showSnackbar('Successfully deleted the comment');
        confirmDeleteDialog.value = false;
        emit('deleted');
      } catch {
        actions.showErrorSnackbar('Failed to delete the comment');
      } finally {
        loading.value = false;
      }
    };

    return {
      canDeleteComment,
      deleteComment,
      confirmDeleteDialog,
      loading,
      formatTimestamp,
    };
  },
});
</script>
