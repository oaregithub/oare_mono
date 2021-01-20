<template>
	<div>
		<v-list>
			<v-list-item v-if='hasComment' @click="$emit('clicked-commenting')" class="test-pencil">
				<v-list-item-title>
					<v-icon>mdi-comment</v-icon>
					Comment
				</v-list-item-title>
			</v-list-item>
			<v-list-item v-if='hasEdit' @click="$emit('clicked-editing')" class="test-pencil">
				<v-list-item-title>
					<v-icon>mdi-pencil</v-icon>
					Edit
				</v-list-item-title>
			</v-list-item>
			<v-list-item v-if='hasDelete' @click="$emit('clicked-deleting')" class="test-close">
				<v-list-item-title>
					<v-icon>mdi-close</v-icon>
					Delete
				</v-list-item-title>
			</v-list-item>
		</v-list>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
  name: 'UtilList',
  props: {
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
  },
});

</script>
