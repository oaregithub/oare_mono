<template>
  <comment-view :is-user-comments="false"> </comment-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import CommentView from './components/CommentView.vue';

export default defineComponent({
  name: 'AdminCommentView',
  components: {
    CommentView,
  },
});
</script>
