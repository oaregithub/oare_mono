<template>
  <div>
    <component
      v-if="showEditDialog"
      :is="dialogComponent"
      v-model="editTranslitDialog"
      :color="color"
      :textUuid="textUuid"
    ></component>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <div
          class="
            sl-background
            d-flex
            flex-column
            align-center
            justify-space-between
            mr-2
            cursor-display
            test-stoplight
          "
          v-on="on"
          v-bind="attrs"
          @click="openDialog"
        >
          <div :class="`sl-light sl-${red ? 'light' : 'dark'}-red`"></div>
          <div :class="`sl-light sl-${yellow ? 'light' : 'dark'}-yellow`"></div>
          <div :class="`sl-light sl-${green ? 'light' : 'dark'}-green`"></div>
        </div>
      </template>
      <span>{{ color.colorMeaning }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import { TranslitOption } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    color: {
      type: Object as PropType<TranslitOption>,
      required: true,
    },
    showEditDialog: {
      type: Boolean,
      default: false,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  setup({ color, showEditDialog }) {
    const store = sl.get('store');

    const red = ref(false);
    const yellow = ref(false);
    const green = ref(false);

    if (color.color === 'Red') {
      red.value = true;
    } else if (color.color === 'Yellow') {
      yellow.value = true;
    } else if (color.color === 'Green') {
      green.value = true;
    } else if (color.color === 'Yellow/Green') {
      yellow.value = true;
      green.value = true;
    } else if (color.color === 'Yellow/Red') {
      yellow.value = true;
      red.value = true;
    }

    const canEditTransliteration = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('EDIT_TRANSLITERATION_STATUS')
    );

    const editTranslitDialog = ref(false);

    const dialogComponent = computed(() =>
      showEditDialog && canEditTransliteration.value
        ? () => import('./EditStoplightDialog.vue')
        : null
    );

    const openDialog = () => {
      if (showEditDialog && canEditTransliteration.value) {
        editTranslitDialog.value = true;
      }
    };

    return {
      red,
      yellow,
      green,
      editTranslitDialog,
      dialogComponent,
      canEditTransliteration,
      openDialog,
    };
  },
});
</script>

<style scoped>
.sl-background {
  height: 40px;
  width: 25px;
  background-color: black;
  padding: 5px;
  border-radius: 10%;
}

.sl-light {
  border-radius: 50%;
  height: 8px;
  width: 8px;
}

.sl-dark-red {
  background-color: hsl(0, 100%, 13%);
}

.sl-dark-yellow {
  background-color: hsl(60, 100%, 13%);
}

.sl-dark-green {
  background-color: hsl(120, 100%, 13%);
}

.sl-light-red {
  background-color: hsl(0, 100%, 50%);
}

.sl-light-yellow {
  background-color: hsl(60, 100%, 50%);
}

.sl-light-green {
  background-color: hsl(120, 100%, 50%);
}

.cursor-display {
  cursor: pointer;
}
</style>
