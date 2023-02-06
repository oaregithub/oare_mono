<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :title="dialogTitle"
    :persistent="false"
    :submitLoading="addRegionLoading"
    :submitDisabled="!formComplete"
    @submit="addRegion"
    :submitText="regionType !== 'broken' ? 'Submit' : 'Yes'"
  >
    <v-row v-if="regionType === 'broken'" class="ma-0"
      >Are you sure you want to add a broken area?</v-row
    >

    <v-row v-if="regionType === 'ruling'" class="ma-0">Ruling(s) Value</v-row>
    <v-row v-if="regionType === 'ruling'" class="ma-0">
      <v-select
        outlined
        dense
        :items="rulingOptions"
        item-text="text"
        item-value="value"
        v-model="regionValue"
      />
    </v-row>

    <v-row v-if="regionType === 'isSealImpression'" class="ma-0"
      >Seal Impression Label (Optional)</v-row
    >
    <v-row v-if="regionType === 'isSealImpression'" class="ma-0">
      <v-text-field outlined dense v-model="regionLabel" placeholder="Ex: A" />
    </v-row>

    <v-row v-if="regionType === 'uninscribed'" class="ma-0"
      >Number of Uninscribed Line(s)</v-row
    >
    <v-row v-if="regionType === 'uninscribed'" class="ma-0">
      <v-select
        outlined
        dense
        :items="uninscribedOptions"
        v-model="regionValue"
      />
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import {
  AddRegionPayload,
  MarkupType,
  EpigraphicUnitSide,
  EditTextAction,
} from '@oare/types';
import sl from '@/serviceLocator';
import { TabletRenderer } from '@oare/oare';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    column: {
      type: Number,
      required: true,
    },
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
    previousLineNumber: {
      type: Number,
      required: false,
    },
    textUuid: {
      type: String,
      required: true,
    },
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    regionType: {
      type: String as PropType<MarkupType>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const addRegionLoading = ref(false);

    const rulingOptions = ref<{ text: string; value: number }[]>([
      {
        text: 'Single',
        value: 1,
      },
      {
        text: 'Double',
        value: 2,
      },
      {
        text: 'Triple',
        value: 3,
      },
    ]);

    const uninscribedOptions = ref([1, 2, 3, 4, 5, 6, 7, 8]);

    const regionLabel = ref<string>();
    const regionValue = ref<number>();

    const formComplete = computed(() => {
      if (
        props.regionType === 'broken' ||
        props.regionType === 'isSealImpression'
      ) {
        return true;
      }
      if (regionValue.value) {
        return true;
      }
      return false;
    });

    const addRegion = async () => {
      try {
        addRegionLoading.value = true;

        let previousObjectOnTablet: number | undefined = undefined;
        if (props.previousLineNumber) {
          const unitsOnPreviousLine = props.renderer.getUnitsOnLine(
            props.previousLineNumber
          );
          previousObjectOnTablet =
            unitsOnPreviousLine[unitsOnPreviousLine.length - 1].objOnTablet;
        }

        let type: EditTextAction;
        switch (props.regionType) {
          case 'broken':
            type = 'addRegionBroken';
            break;
          case 'ruling':
            type = 'addRegionRuling';
            break;
          case 'isSealImpression':
            type = 'addRegionSealImpression';
            break;
          default:
            type = 'addRegionUninscribed';
            break;
        }

        const payload: AddRegionPayload = {
          type,
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          regionValue: regionValue.value,
          regionLabel: regionLabel.value,
          previousObjectOnTablet,
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding region. Please try again.',
          err as Error
        );
      } finally {
        addRegionLoading.value = false;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    const dialogTitle = computed(() => {
      switch (props.regionType) {
        case 'broken':
          return 'Add Broken Area';
        case 'ruling':
          return 'Add Ruling';
        case 'isSealImpression':
          return 'Add Seal Impression';
        default:
          return 'Add Uninscribed Line(s)';
      }
    });

    return {
      addRegionLoading,
      regionValue,
      regionLabel,
      rulingOptions,
      uninscribedOptions,
      formComplete,
      addRegion,
      dialogTitle,
    };
  },
});
</script>
