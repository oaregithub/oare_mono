<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :width="1000"
    :show-submit="false"
    :show-cancel="false"
    :closeButton="true"
  >
    <EpigraphyView v-if="itemType === 'Text'" :textUuid="uuid"></EpigraphyView>
    <CollectionTexts
      v-if="itemType === 'Collection'"
      :collectionUuid="uuid"
    ></CollectionTexts>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { PermissionsListType } from '@oare/types';
import OareDialog from '../../components/base/OareDialog.vue';
import EpigraphyView from '../EpigraphyView/index.vue';
import CollectionTexts from '../CollectionTexts/index.vue';

export default defineComponent({
  name: 'TextAndCollectionsDialog',
  components: {
    OareDialog,
    EpigraphyView,
    CollectionTexts,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    uuid: {
      type: String,
      required: true,
    },
    itemType: {
      type: String as PropType<PermissionsListType>,
      required: true,
    },
  },
});
</script>
