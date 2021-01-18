<template>
	<div>
		<div @mouseover='displayDropdown = true' @mouseleave='displayDropdown = false'>
			{{word}}
			<div style='position: absolute' v-if='displayDropdown'>
				<v-btn
				@click='displayDialog = true'
				class="mr-2 mb-2"
				small
				color="primary"
				>Comment</v-btn>
			</div>
		</div>
		<div v-if='displayDialog'>
			<oare-dialog
					:value="true"
					@submit='insertComment'
					@input="$emit('input', $event)"
					:width="1000"
					:show-submit="true"
					:show-cancel="true"
					:closeButton="true"
					:persistent="false"
					v-model="displayDialog"
			>
				<v-row>
					<v-col cols='12'>
						<h1>{{word}}</h1>
					</v-col>
					<v-col cols='12'>
						<v-container fluid>
							<v-textarea
									name="comment"
									label="Comment"
									auto-grow
									prepend-icon="mdi-comment"
									v-model='userComment'
							></v-textarea>
						</v-container>
					</v-col>
				</v-row>
			</oare-dialog>
		</div>
	</div>
</template>

<script lang='ts'>
import {
defineComponent,
ref,
PropType,
} from '@vue/composition-api';
import OareDialog from '../../components/base/OareDialog.vue';
import sl from '@/serviceLocator';
import { Comment } from '@oare/types';
import { Thread } from '@oare/types';
import { CommentRequest } from '@oare/types';


export default defineComponent({
  name: 'DictionaryWordDisplay',
  components: {
    OareDialog,
  },
  props: {
    word: {
      type: String as PropType<string>,
      required: true,
	},
    route: {
      type: String as PropType<string>,
      required: true,
    },
    uuid: {
      type: String as PropType<string>,
      required: true,
    },
  },
  setup({word, route, uuid}) {
    const displayDropdown = ref(false);
    const displayDialog = ref(false);
    const loading = ref(false);
    const userComment = ref('');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');


    const insertComment = async () => {
      if(store.getters.user === null) {
        actions.showErrorSnackbar('Please login before making a comment.');
	  }

      loading.value = true;
      try {
        const comment: Comment = {uuid: null, threadUuid: null, userUuid: store.getters.user?.uuid, createdAt: '2021', deleted: false, text: userComment.value}
        const thread: Thread = {uuid: null, referenceUuid: uuid, status: 'Untouched', route: route}
        const request: CommentRequest = {comment: comment, thread: thread}
        await server.insertComment(request);
        // await server.getNames(comment.value);
        actions.showSnackbar('Successfully added the comment');
      } catch {
        actions.showErrorSnackbar('Failed to retrieve name words');
      } finally {
        loading.value = false;
      }
    };

    return {
		insertComment,
		displayDropdown,
		displayDialog,
		userComment,
	};
  },
});
</script>

<style scoped>

</style>
