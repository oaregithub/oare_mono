<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :width="1000"
    :show-submit="false"
    :show-cancel="false"
    :closeButton="true"
    :persistent="false"
    :title="itemType === 'Text' ? name : ''"
  >
    <v-progress-linear v-if="loading" indeterminate />
    <EpigraphyFullDisplay
      v-if="itemType === 'Text' && !loading"
      :epigraphicUnits="epigraphicUnits"
      :markupUnits="markupUnits"
      :discourseUnits="discourseUnits"
    ></EpigraphyFullDisplay>
    <CollectionTexts
      v-if="itemType === 'Collection' && !loading"
      :collectionUuid="uuid"
      :hideDetails="true"
    ></CollectionTexts>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { PermissionsListType } from '@oare/types';
import { EpigraphicUnit, MarkupUnit, DiscourseUnit } from '@oare/oare';
import sl from '@/serviceLocator';
import OareDialog from '../../components/base/OareDialog.vue';
import EpigraphyFullDisplay from '../EpigraphyView/EpigraphyFullDisplay.vue';
import CollectionTexts from '../CollectionTexts/index.vue';

export default defineComponent({
  name: 'TextAndCollectionsDialog',
  components: {
    OareDialog,
    EpigraphyFullDisplay,
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
    name: {
      type: String,
      required: true,
    },
    itemType: {
      type: String as PropType<PermissionsListType>,
      required: true,
    },
  },
  setup(props) {
    const epigraphicUnits = ref<EpigraphicUnit[]>([]);
    const markupUnits = ref<MarkupUnit[]>([]);
    const discourseUnits = ref<DiscourseUnit[]>([]);
    const loading = ref(false);

    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    watch(
      () => props.value,
      async open => {
        if (open && props.itemType === 'Text') {
          try {
            loading.value = true;
            const {
              markups,
              units,
              discourseUnits: dUnits,
            } = await server.getEpigraphicInfo(props.uuid);
            epigraphicUnits.value = units;
            markupUnits.value = markups;
            discourseUnits.value = dUnits;
          } catch {
            actions.showErrorSnackbar('Failed to load text info.');
          } finally {
            loading.value = false;
          }
        }
      },
      { immediate: true }
    );

    return {
      loading,
      epigraphicUnits,
      discourseUnits,
      markupUnits,
    };
  },
});
</script>
