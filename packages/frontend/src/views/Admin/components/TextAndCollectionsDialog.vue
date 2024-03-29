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
import {
  EpigraphicUnit,
  DiscourseUnit,
  PermissionsListType,
} from '@oare/types';
import sl from '@/serviceLocator';
import OareDialog from '@/components/base/OareDialog.vue';
import EpigraphyFullDisplay from '@/views/Texts/EpigraphyView/EpigraphyDisplay/EpigraphyFullDisplay.vue';
import CollectionTexts from '@/views/Texts/CollectionTexts/index.vue';

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
              units,
              discourseUnits: dUnits,
            } = await server.getEpigraphicInfo(props.uuid);
            epigraphicUnits.value = units;
            discourseUnits.value = dUnits;
          } catch (err) {
            actions.showErrorSnackbar(
              'Failed to load text info.',
              err as Error
            );
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
    };
  },
});
</script>
