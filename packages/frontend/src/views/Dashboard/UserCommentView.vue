<template>
  <comment-view></comment-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import CommentView from '../Admin/Comments/components/CommentView.vue';

export default defineComponent({
  name: 'UserCommentView',
  components: {
    CommentView,
  },
});
</script>
