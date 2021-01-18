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
									v-model='comment'
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
  },
  setup() {
    const displayDropdown = ref(false);
    const displayDialog = ref(false);
    const loading = ref(false);
    const comment = ref('');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');


    const insertComment = async () => {
      loading.value = true;
      try {
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
		comment,
	};
  },
});
</script>

<style scoped>

</style>
