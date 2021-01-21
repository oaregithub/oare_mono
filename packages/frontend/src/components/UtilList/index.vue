<template>
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <div
        style="white-space: nowrap"
        v-if="markWord"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        <template v-if="hover">
          <mark>
            <span
              v-if="hasHtml"
              v-html="word"
              v-bind="attrs"
              v-on="on"
              class="test-spelling"
            ></span>
            <span v-else class="test-spelling" v-bind="attrs" v-on="on">{{
              word
            }}</span>
          </mark>
        </template>
        <template v-else>
          <span
            v-if="hasHtml"
            v-html="word"
            v-bind="attrs"
            v-on="on"
            class="test-spelling"
          ></span>
          <span v-else class="test-spelling" v-bind="attrs" v-on="on">{{
            word
          }}</span>
        </template>
      </div>
      <div v-else>
        <span
          v-if="hasHtml"
          v-html="word"
          v-bind="attrs"
          v-on="on"
          class="test-spelling"
        ></span>
        <span v-else class="test-spelling" v-bind="attrs" v-on="on">{{
          word
        }}</span>
      </div>
    </template>
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
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'UtilList',
  props: {
    word: {
      type: String as PropType<string>,
      required: true,
    },
    hasHtml: {
      type: Boolean as PropType<boolean>,
      required: false,
    },
    hasComment: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    hasEdit: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    hasDelete: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
    markWord: {
      type: Boolean as PropType<boolean>,
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

<style scoped>
.test-comment {
}
</style>
