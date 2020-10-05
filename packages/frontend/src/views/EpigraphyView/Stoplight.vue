<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <div
        class="sl-background d-flex flex-column align-center justify-space-between mr-2"
        v-on="on"
        v-bind="attrs"
      >
        <div :class="`sl-light sl-${red ? 'light' : 'dark'}-red`"></div>
        <div :class="`sl-light sl-${yellow ? 'light' : 'dark'}-yellow`"></div>
        <div :class="`sl-light sl-${green ? 'light' : 'dark'}-green`"></div>
      </div>
    </template>
    <span>{{ colorMeaning }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  props: {
    color: {
      type: String,
      required: true,
    },
    colorMeaning: {
      type: String,
      required: true,
    },
  },
  setup({ color }) {
    const red = ref(false);
    const yellow = ref(false);
    const green = ref(false);

    if (color === 'Red') {
      red.value = true;
    } else if (color === 'Yellow') {
      yellow.value = true;
    } else if (color === 'Green') {
      green.value = true;
    } else if (color === 'Yellow/Green') {
      yellow.value = true;
      green.value = true;
    } else if (color === 'Yellow/Red') {
      yellow.value = true;
      red.value = true;
    }

    return {
      red,
      yellow,
      green,
    };
  },
});
</script>

<style scoped>
.sl-background {
  height: 70px;
  width: 40px;
  background-color: black;
  padding: 10px;
  border-radius: 10%;
}

.sl-light {
  border-radius: 50%;
  height: 15px;
  width: 15px;
}

.sl-dark-red {
  background-color: hsl(0, 100%, 10%);
}

.sl-dark-yellow {
  background-color: hsl(60, 100%, 10%);
}

.sl-dark-green {
  background-color: hsl(120, 100%, 10%);
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
</style>
