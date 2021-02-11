<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :width="500"
    :show-submit="false"
    :show-cancel="false"
    :closeButton="true"
    :persistent="false"
  >
    <v-list>
      <v-list-item
        v-if="hasComment"
        @click="$emit('clicked-commenting')"
        class="test-comment"
      >
        <v-list-item-title>
          <v-icon>mdi-comment</v-icon>
          Comment
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="hasEdit"
        @click="$emit('clicked-editing')"
        class="test-pencil"
      >
        <v-list-item-title>
          <v-icon>mdi-pencil</v-icon>
          Edit
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="hasDelete"
        @click="$emit('clicked-deleting')"
        class="test-close"
      >
        <v-list-item-title>
          <v-icon>mdi-close</v-icon>
          Delete
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

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
  },
  setup(props) {
    return {};
  },
});
</script>
