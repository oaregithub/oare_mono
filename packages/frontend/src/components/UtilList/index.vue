<template>
  <v-menu offset-y v-if="!hideMenu">
    <template v-slot:activator="{ on }">
      <slot name="activator" :on="on"></slot>
    </template>
    <v-list>
      <v-list-item
        v-if="hasComment && hasCommentPermission"
        @click="$emit('comment-clicked')"
        class="test-comment"
      >
        <v-list-item-title>
          <v-icon>mdi-comment</v-icon>
          Comment
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="hasEdit"
        @click="$emit('edit-clicked')"
        class="test-pencil"
      >
        <v-list-item-title>
          <v-icon>mdi-pencil</v-icon>
          Edit
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="hasDelete"
        @click="$emit('delete-clicked')"
        class="test-close"
      >
        <v-list-item-title>
          <v-icon>mdi-close</v-icon>
          Delete
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
  <span v-else>
    <slot name="activator" />
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'UtilList',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    hasComment: {
      type: Boolean,
      default: true,
    },
    hasEdit: {
      type: Boolean,
      default: true,
    },
    hasDelete: {
      type: Boolean,
      default: true,
    },
    hideMenu: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const store = sl.get('store');

    const hasCommentPermission = computed(() =>
      store.hasPermission('ADD_COMMENTS')
    );
    return { hasCommentPermission };
  },
});
</script>
