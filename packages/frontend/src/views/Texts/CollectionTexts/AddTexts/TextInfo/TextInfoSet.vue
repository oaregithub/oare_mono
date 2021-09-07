<template>
  <v-container fluid>
    <v-row>
      <v-col cols="6">
        <v-text-field
          v-model="textName"
          outlined
          label="Text Name"
          placeholder="e.g. Chantre 1"
          :rules="[validateName]"
          :error="!textName"
        />
        <v-text-field
          v-model="cdliNum"
          outlined
          label="CDLI Number"
          placeholder="e.g. P18756"
          :rules="[validateCdli]"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  setup() {
    const textName = ref('');
    const cdliNum = ref('');

    const validateName = (input: string) => {
      if (!input) {
        return '* Required';
      }
      //TODO Make sure text name doesn't already exist in the collection
      return true;
    };

    const validateCdli = (input: string) => {
      //TODO Make sure cdli num doesn't already exist
      return true;
    };

    return {
      textName,
      cdliNum,
      validateName,
      validateCdli,
    };
  },
});
</script>
