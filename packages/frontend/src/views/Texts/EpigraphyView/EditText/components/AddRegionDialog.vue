<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Region"
    :persistent="false"
    :submitLoading="addRegionLoading"
    :submitDisabled="!formComplete"
    @submit="addRegion"
  >
    <v-row class="ma-0"
      >Select the type of region you would like to add, then complete any
      required details.</v-row
    >
    <v-row class="ma-0 mt-4">Region Type</v-row>
    <v-row class="ma-0">
      <v-select
        outlined
        dense
        :items="regionOptions"
        item-text="text"
        item-value="value"
        v-model="selectedRegion"
      />
    </v-row>

    <v-row v-if="selectedRegion === 'ruling'" class="ma-0"
      >Ruling(s) Value</v-row
    >
    <v-row v-if="selectedRegion === 'ruling'" class="ma-0">
      <v-select
        outlined
        dense
        :items="rulingOptions"
        item-text="text"
        item-value="value"
        v-model="regionValue"
      />
    </v-row>

    <v-row v-if="selectedRegion === 'isSealImpression'" class="ma-0"
      >Seal Impression Label (Optional)</v-row
    >
    <v-row v-if="selectedRegion === 'isSealImpression'" class="ma-0">
      <v-text-field outlined dense v-model="regionLabel" placeholder="Ex: A" />
    </v-row>

    <v-row v-if="selectedRegion === 'uninscribed'" class="ma-0"
      >Number of Uninscribed Line(s)</v-row
    >
    <v-row v-if="selectedRegion === 'uninscribed'" class="ma-0">
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
import {
  defineComponent,
  ref,
  computed,
  watch,
  PropType,
} from '@vue/composition-api';
import { AddRegionPayload, MarkupType, EpigraphicUnitSide } from '@oare/types';
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
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const addRegionLoading = ref(false);

    const regionOptions = ref<{ text: string; value: MarkupType }[]>([
      {
        text: 'Broken Area',
        value: 'broken',
      },
      {
        text: 'Ruling(s)',
        value: 'ruling',
      },
      {
        text: 'Seal Impression',
        value: 'isSealImpression',
      },
      {
        text: 'Uninscribed Line(s)',
        value: 'uninscribed',
      },
    ]);

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

    const selectedRegion = ref<MarkupType>();
    const regionLabel = ref<string>();
    const regionValue = ref<number>();

    const formComplete = computed(() => {
      if (!selectedRegion.value) {
        return false;
      }
      if (
        selectedRegion.value === 'broken' ||
        selectedRegion.value === 'isSealImpression'
      ) {
        return true;
      }
      if (regionValue.value) {
        return true;
      }
      return false;
    });

    watch(selectedRegion, () => {
      regionLabel.value = undefined;
      regionValue.value = undefined;
    });

    const addRegion = async () => {
      try {
        addRegionLoading.value = true;

        if (!selectedRegion.value) {
          throw new Error('No region type selected');
        }

        let previousObjectOnTablet: number | undefined = undefined;
        if (props.previousLineNumber) {
          const unitsOnPreviousLine = props.renderer.getUnitsOnLine(
            props.previousLineNumber
          );
          previousObjectOnTablet =
            unitsOnPreviousLine[unitsOnPreviousLine.length - 1].objOnTablet;
        }

        const payload: AddRegionPayload = {
          type: 'addRegion',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          regionType: selectedRegion.value,
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

    return {
      addRegionLoading,
      regionOptions,
      selectedRegion,
      regionValue,
      regionLabel,
      rulingOptions,
      uninscribedOptions,
      formComplete,
      addRegion,
    };
  },
});
</script>
