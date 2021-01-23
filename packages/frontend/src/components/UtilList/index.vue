<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <div
        v-if="markWord"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        <template v-if="hover">
          <mark>
            <span class="test-spelling" v-bind="attrs" v-on="on">
              <slot></slot>
            </span>
          </mark>
        </template>
        <template v-else>
          <span class="test-spelling" v-bind="attrs" v-on="on">
            <slot></slot>
          </span>
        </template>
      </div>
      <div v-else>
        <span class="test-spelling" v-bind="attrs" v-on="on">
          <slot></slot>
        </span>
      </div>
    </template>
    <v-list>
      <v-list-item
        v-if="hasComment"
        @click="$emit('clicked-commenting', word, uuid, route)"
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
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'UtilList',
  props: {
    word: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: false,
    },
    uuid: {
      type: String,
      required: false,
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
    markWord: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const hover = ref(false);

    return {
      hover,
    };
  },
});
</script>
