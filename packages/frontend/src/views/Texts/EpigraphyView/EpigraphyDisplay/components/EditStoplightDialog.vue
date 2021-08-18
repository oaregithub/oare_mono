<template>
  <oare-dialog
    title="Edit Transliteration Status"
    :value="value"
    @input="$emit('input', $event)"
    @submit="updateTranslitStatus"
    :closeOnSubmit="true"
    class="test-stoplight-dialog"
    :width="750"
  >
    <v-row align="center">
      <v-col cols="2">
        <stoplight
          :transliteration="selectedStatus"
          :key="selectedColor"
          :textUuid="textUuid"
          :large="true"
          class="ml-2"
        />
      </v-col>
      <v-col cols="10">
        <v-radio-group v-model="selectedColor">
          <v-radio
            v-for="(option, idx) in translitOptions"
            :key="idx"
            :label="`${option.color} - ${option.colorMeaning}`"
            :value="option.color"
            class="test-translit-option my-2"
          >
            <template #label>
              <v-container>
                <v-row>
                  <b>{{ option.color }}</b>
                </v-row>
                <v-row>
                  <span>{{ option.colorMeaning }}</span>
                </v-row>
              </v-container>
            </template>
          </v-radio>
        </v-radio-group>
      </v-col>
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  PropType,
  computed,
  inject,
} from '@vue/composition-api';
import Stoplight from './Stoplight.vue';
import { TranslitOption } from '@oare/types';
import sl from '@/serviceLocator';
import { EpigraphyReloadKey } from '../../index.vue';

export default defineComponent({
  components: {
    Stoplight,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    transliteration: {
      type: Object as PropType<TranslitOption>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const translitOptions = ref<TranslitOption[]>([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const selectedColor = ref(props.transliteration.color);
    const reload = inject(EpigraphyReloadKey);

    onMounted(async () => {
      translitOptions.value = await server.getTranslitOptions();
    });

    const translitDictionary = computed(() => {
      const map = new Map();
      translitOptions.value.map(option =>
        map.set(option.color, option.colorMeaning)
      );
      return map;
    });

    const selectedStatus = computed(() => ({
      color: selectedColor.value,
      colorMeaning: translitDictionary.value.get(selectedColor.value),
    }));

    const updateTranslitStatus = async () => {
      try {
        await server.updateTranslitStatus(props.textUuid, selectedColor.value);
        actions.showSnackbar('Successfully updated transliteration status.');
        reload && reload();
      } catch {
        actions.showErrorSnackbar(
          'Error updating transliteration status. Please try again.'
        );
      }
    };

    return {
      translitOptions,
      selectedColor,
      selectedStatus,
      updateTranslitStatus,
    };
  },
});
</script>
