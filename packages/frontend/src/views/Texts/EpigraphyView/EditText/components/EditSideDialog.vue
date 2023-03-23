<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Change Side Designation"
    :persistent="false"
    :submitLoading="editSideLoading"
    :submitDisabled="!formComplete"
    @submit="editSide"
  >
    <v-row class="ma-0"
      >Select the side you would like to edit and then select the side
      designation you would like to change it to.</v-row
    >
    <v-row class="ma-0 mt-4">Side You Want to Edit</v-row>
    <v-row class="ma-0">
      <v-select outlined dense :items="alreadyUsedSides" v-model="originalSide">
        <template #item="{ item, attrs, on }">
          <v-list-item v-bind="attrs" v-on="on">
            <v-list-item-content>
              <v-list-item-title
                >{{ item }}
                <v-menu v-if="item === 'obv. ii'" offset-y open-on-hover bottom>
                  <template #activator="{ on, attrs }">
                    <v-icon v-bind="attrs" v-on="on" small class="ml-1 mr-n2">
                      mdi-information-outline
                    </v-icon>
                  </template>
                  <v-card class="pa-3">
                    <span>
                      For use only when writer continues from u.e. onto obv.
                      near end of text.
                    </span>
                  </v-card>
                </v-menu>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template></v-select
      >
    </v-row>

    <v-row class="ma-0">New Designation for Side</v-row>
    <v-row class="ma-0">
      <v-select outlined dense :items="usableSides" v-model="newSide">
        <template #item="{ item, attrs, on }">
          <v-list-item v-bind="attrs" v-on="on">
            <v-list-item-content>
              <v-list-item-title
                >{{ item }}
                <v-menu v-if="item === 'obv. ii'" offset-y open-on-hover bottom>
                  <template #activator="{ on, attrs }">
                    <v-icon v-bind="attrs" v-on="on" small class="ml-1 mr-n2">
                      mdi-information-outline
                    </v-icon>
                  </template>
                  <v-card class="pa-3">
                    <span>
                      For use only when writer continues from u.e. onto obv.
                      near end of text.
                    </span>
                  </v-card>
                </v-menu>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-select>
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import { EditSidePayload, EpigraphicUnitSide } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
    usableSides: {
      type: Array as PropType<EpigraphicUnitSide[]>,
      required: true,
    },
    alreadyUsedSides: {
      type: Array as PropType<EpigraphicUnitSide[]>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editSideLoading = ref(false);

    const originalSide = ref<EpigraphicUnitSide | null>(null);
    const newSide = ref<EpigraphicUnitSide | null>(null);

    const formComplete = computed(() => originalSide.value && newSide.value);

    const editSide = async () => {
      try {
        editSideLoading.value = true;

        if (!originalSide.value || !newSide.value) {
          throw new Error('Required side designations not provided');
        }

        const payload: EditSidePayload = {
          type: 'editSide',
          textUuid: props.textUuid,
          originalSide: originalSide.value,
          newSide: newSide.value,
        };
        await server.editText(payload);
        emit('reset-renderer');
        emit('selected-side', newSide.value);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing side designation. Please try again.',
          err as Error
        );
      } finally {
        editSideLoading.value = false;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    return {
      editSideLoading,
      originalSide,
      newSide,
      formComplete,
      editSide,
    };
  },
});
</script>
