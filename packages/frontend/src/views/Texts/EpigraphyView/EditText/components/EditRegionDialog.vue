<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :title="dialogTitle"
    :persistent="false"
    :submitLoading="editRegionLoading"
    :submitDisabled="!formComplete"
    @submit="editRegion"
  >
    <div v-if="regionType === 'broken'">
      <v-row class="ma-0 mb-4"
        >If desired, you can choose to convert the broken area to a specified
        number of broken lines.</v-row
      >
      <v-row class="ma-0">Number of Broken Lines (Optional)</v-row>
      <v-row class="ma-0">
        <v-select
          outlined
          dense
          :items="numberedOptions"
          v-model="regionValue"
        />
      </v-row>
    </div>

    <div v-else-if="regionType === 'ruling'">
      <v-row class="ma-0">Ruling(s) Value</v-row>
      <v-row class="ma-0">
        <v-select
          outlined
          dense
          :items="rulingOptions"
          item-text="text"
          item-value="value"
          v-model="regionValue"
        />
      </v-row>
    </div>

    <div v-else-if="regionType === 'isSealImpression'">
      <v-row class="ma-0">Seal Impression Label (Optional)</v-row>
      <v-row class="ma-0">
        <v-text-field
          outlined
          dense
          v-model="regionLabel"
          placeholder="Ex: A"
        />
      </v-row>
    </div>

    <div v-else-if="regionType === 'uninscribed'">
      <v-row class="ma-0">Number of Uninscribed Line(s)</v-row>
      <v-row class="ma-0">
        <v-select
          outlined
          dense
          :items="numberedOptions"
          v-model="regionValue"
        />
      </v-row>
    </div>

    <v-row v-else class="ma-0"
      >The selected region type is not yet editable. Please contact an admin for
      help updating this region.</v-row
    >
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  onMounted,
} from '@vue/composition-api';
import { TabletRenderer } from '@oare/oare';
import sl from '@/serviceLocator';
import { EditRegionPayload, MarkupType, EditTextAction } from '@oare/types';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    line: {
      type: Number,
      required: true,
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

    const editRegionLoading = ref(false);

    const editRegion = async () => {
      try {
        editRegionLoading.value = true;

        if (!formComplete.value) {
          throw new Error('Edit region form is not complete.');
        }

        const regionUnit = props.renderer.getRegionUnitByLine(props.line);
        if (!regionUnit) {
          throw new Error('No region unit found for line.');
        }

        let type: EditTextAction;
        switch (props.regionType) {
          case 'broken':
            type = 'editRegionBroken';
            break;
          case 'ruling':
            type = 'editRegionRuling';
            break;
          case 'isSealImpression':
            type = 'editRegionSealImpression';
            break;
          default:
            type = 'editRegionUninscribed';
            break;
        }

        const payload: EditRegionPayload = {
          type,
          textUuid: props.textUuid,
          uuid: regionUnit.uuid,
          regionType: props.regionType,
          regionValue: regionValue.value,
          regionLabel: regionLabel.value,
        };

        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing region. Please try again.',
          err as Error
        );
      } finally {
        editRegionLoading.value = false;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    const formComplete = computed(() => {
      if (
        props.regionType === 'ruling' ||
        props.regionType === 'uninscribed' ||
        props.regionType === 'broken'
      ) {
        return (
          !!regionValue.value && regionValue.value !== originalRegionValue.value
        );
      }
      if (props.regionType === 'isSealImpression') {
        return regionLabel.value !== originalRegionLabel.value;
      }
      return false;
    });

    const originalRegionValue = ref<number>();
    const regionValue = ref<number>();
    const originalRegionLabel = ref<string>();
    const regionLabel = ref<string>();

    onMounted(() => {
      try {
        const regionUnit = props.renderer.getRegionUnitByLine(props.line);

        if (!regionUnit) {
          throw new Error('No region unit found for line.');
        }

        if (
          props.regionType === 'ruling' ||
          props.regionType === 'uninscribed'
        ) {
          originalRegionValue.value = regionUnit.markups[0].value || undefined;
          regionValue.value = regionUnit.markups[0].value || undefined;
        } else if (props.regionType === 'isSealImpression') {
          originalRegionLabel.value = regionUnit.reading || undefined;
          regionLabel.value = regionUnit.reading || undefined;
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error preparing edit region. Please try again.',
          err as Error
        );
      }
    });

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

    const numberedOptions = ref([1, 2, 3, 4, 5, 6, 7, 8]);

    const dialogTitle = computed(() => {
      switch (props.regionType) {
        case 'broken':
          return 'Convert Broken Area To Broken Line(s)';
        case 'ruling':
          return 'Edit Ruling';
        case 'isSealImpression':
          return 'Edit Seal Impression';
        default:
          return 'Edit Uninscribed Line(s)';
      }
    });

    return {
      editRegionLoading,
      editRegion,
      formComplete,
      rulingOptions,
      regionValue,
      regionLabel,
      numberedOptions,
      originalRegionValue,
      originalRegionLabel,
      dialogTitle,
    };
  },
});
</script>
