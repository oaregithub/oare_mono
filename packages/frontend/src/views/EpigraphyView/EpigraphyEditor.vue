<template>
  <div>
    <div>
      <oare-loader-button
        color="primary"
        class="mr-2"
        :loading="saveLoading"
        @click="createDraft"
        >Save draft</oare-loader-button
      >
      <v-btn color="info" @click="$emit('close-editor')">Close editor</v-btn>
    </div>
    <div v-for="(sideData, idx) in textData" :key="idx">
      <div class="d-flex justify-space-between align-baseline">
        <v-col cols="6">
          <v-autocomplete
            v-model="sideData.side"
            :items="usableSides(sideData.side)"
          />
        </v-col>
        <v-btn color="error" text @click="openRemoveDialog(idx)"
          >Remove side</v-btn
        >
      </div>
      <v-textarea v-model="sideData.text" outlined class="mb-3" />
    </div>
    <v-btn
      v-if="textData.length < sideTypes.length"
      text
      color="primary"
      @click="addSide"
      >Add side</v-btn
    >
    <OareDialog
      v-model="removeDialog.open"
      title="Confirm remove"
      @submit="removeSide"
      closeOnSubmit
    >
      Are you sure you want to remove this side? All edits you have made to it
      will be lost.
    </OareDialog>
  </div>
</template>

<script>
import server from '../../serverProxy';

export default {
  name: 'EpigraphyEditor',
  props: {
    // List of objects with "key" => side
    // and "lines" => list of line readings
    sides: {
      type: Array,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
    draftSaveLoading: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    textData: [],
    saveLoading: false,
    removeDialog: {
      open: false,
      deleteSide: null,
    },
  }),

  created() {
    for (const sideData of this.sides) {
      this.textData.push({ ...sideData });
    }
  },

  methods: {
    async createDraft() {
      this.saveLoading = true;
      await server.createDraft(this.textUuid, JSON.stringify(this.textData));
      this.$emit('save-draft', this.textData);
      this.saveLoading = false;
    },

    openRemoveDialog(side) {
      this.$set(this.removeDialog, 'open', true);
      this.$set(this.removeDialog, 'deleteSide', side);
    },

    removeSide() {
      const deleteSide = this.removeDialog.deleteSide;
      this.textData = [
        ...this.textData.slice(0, deleteSide),
        ...this.textData.slice(deleteSide + 1),
      ];
    },

    addSide() {
      this.textData.push({
        side: '',
        text: '',
      });
    },

    usableSides(usedSide) {
      const usedSides = this.textData.map(sideData => sideData.side);
      return this.sideTypes.filter(
        side => side === '' || side === usedSide || !usedSides.includes(side)
      );
    },
  },

  computed: {
    sideTypes() {
      return ['', 'obv.', 'lo.e.', 'rev.', 'u.e.', 'le.e.', 'r.e.'];
    },
  },
};
</script>

<style></style>
