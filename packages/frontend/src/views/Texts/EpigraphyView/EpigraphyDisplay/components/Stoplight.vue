<template>
  <div>
    <component
      v-if="showEditDialog && dialogComponent"
      :is="dialogComponent"
      v-model="editTranslitDialog"
      :transliteration="transliteration"
      :textUuid="textUuid"
    ></component>
    <v-tooltip bottom :disabled="!showEditDialog">
      <template #activator="{ on, attrs }">
        <div
          class="
            sl-background
            d-flex
            flex-column
            align-center
            justify-space-between
            test-stoplight
          "
          :class="{
            'cursor-display': showEditDialog && canEditTransliteration,
            'sl-background-lg': large,
            'sl-background-sm': !large,
          }"
          v-on="on"
          v-bind="attrs"
          @click="openDialog"
        >
          <div
            :class="`sl-light 
            sl-light-${large ? 'lg' : 'sm'} 
            sl-${red ? 'light' : 'dark'}-red`"
          ></div>
          <div
            :class="`sl-light 
            sl-light-${large ? 'lg' : 'sm'} 
            sl-${yellow ? 'light' : 'dark'}-yellow`"
          ></div>
          <div
            :class="`sl-light 
            sl-light-${large ? 'lg' : 'sm'} 
            sl-${green ? 'light' : 'dark'}-green`"
          ></div>
        </div>
      </template>
      <span>{{ transliteration.colorMeaning }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import { TranslitOption } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    transliteration: {
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
    large: {
      type: Boolean,
      default: false,
    },
  },
  setup({ transliteration, showEditDialog }) {
    const store = sl.get('store');

    const red = ref(false);
    const yellow = ref(false);
    const green = ref(false);

    if (transliteration.color === 'Red') {
      red.value = true;
    } else if (transliteration.color === 'Yellow') {
      yellow.value = true;
    } else if (transliteration.color === 'Green') {
      green.value = true;
    } else if (transliteration.color === 'Yellow/Green') {
      yellow.value = true;
      green.value = true;
    } else if (transliteration.color === 'Yellow/Red') {
      yellow.value = true;
      red.value = true;
    }

    const canEditTransliteration = computed(() =>
      store.hasPermission('EDIT_TRANSLITERATION_STATUS')
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
  background-color: black;
  border-radius: 10%;
}

.sl-background-sm {
  height: 40px;
  width: 25px;
  padding: 5px;
}

.sl-background-lg {
  height: 120px;
  width: 75px;
  padding: 15px;
}

.sl-light {
  border-radius: 50%;
}

.sl-light-sm {
  height: 8px;
  width: 8px;
}

.sl-light-lg {
  height: 24px;
  width: 24px;
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
