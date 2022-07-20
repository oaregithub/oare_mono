<template>
  <v-menu offset-y open-on-click :close-on-content-click="false">
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      <span
        ><h3>{{ name }}</h3></span
      >
      <br />
      <span v-if="type"
        ><b>Var Type</b>: {{ type
        }}{{
          type === 'link' && tableReference ? ` > ${tableReference}` : ''
        }}</span
      >
      <div v-if="!isEditing && !isAdding">
        <span>
          <b>Description</b>: {{ newDescription ? newDescription : 'none' }}
        </span>
        <br />
        <span> <b>Primacy</b>: {{ newPrimacy }} </span>
        <br />
        <span><b>Language</b>: {{ newLanguage }}</span
        ><br />
        <br />
        <v-btn
          v-if="reactiveFieldUuid"
          class="mr-1"
          @click="isEditing = true"
          small
          >Edit</v-btn
        >
        <v-btn v-else class="mr-1" @click="isAdding = true" small
          >Add Description</v-btn
        >
      </div>
      <div v-else>
        <span>
          <v-select
            label="Primacy"
            v-model="newPrimacy"
            filled
            :items="[1, 2]"
          ></v-select>
          <v-textarea
            label="Description"
            v-model="newDescription"
            filled
          ></v-textarea>
          <v-progress-circular
            size="20"
            v-if="isSaving"
            indeterminate
            color="#757575"
            class="mt-3"
          />
          <v-btn
            v-if="!isSaving && reactiveFieldUuid && isEditing"
            icon
            :disabled="!canSubmit"
            @click="saveEdit"
            class="test-check"
          >
            <v-icon>mdi-check</v-icon>
          </v-btn>
          <v-btn
            v-if="!isSaving && !reactiveFieldUuid && isAdding"
            icon
            :disabled="!canSubmit"
            @click="addDescription"
            class="test-check"
          >
            <v-icon>mdi-check</v-icon>
          </v-btn>
          <v-btn v-if="!isSaving" icon @click="closeInput" class="test-close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </span>
      </div>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, Ref, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import SpecialChars from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/SpecialChars.vue';
import { FieldInfo } from '@oare/types';

export default defineComponent({
  components: { SpecialChars },
  name: 'PropertyInfo',
  props: {
    variableOrValueUuid: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: 'No Name',
    },
    description: {
      type: String,
      default: '',
    },
    primacy: {
      type: Number,
      default: 0,
    },
    fieldUuid: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'n/a',
    },
    type: {
      type: String,
      default: '',
    },
    tableReference: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const isEditing: Ref<Boolean> = ref(false);
    const isAdding: Ref<Boolean> = ref(false);
    const isSaving: Ref<Boolean> = ref(false);
    const newDescription: Ref<string> = ref(props.description);
    const newPrimacy: Ref<number> = ref(props.primacy);
    const newLanguage: Ref<string> = ref(props.language);
    const reactiveFieldUuid: Ref<string> = ref(props.fieldUuid);

    const closeInput = () => {
      isEditing.value = false;
      isAdding.value = false;
      isSaving.value = false;
    };

    const saveEdit = async () => {
      const actions = sl.get('globalActions');
      isSaving.value = true;
      if (reactiveFieldUuid.value) {
        try {
          await server.updatePropertyDescriptionField({
            uuid: reactiveFieldUuid.value,
            description: newDescription.value,
            primacy: newPrimacy.value,
          });

          await assignNewValues();
          actions.showSnackbar('Successfully updated description');
        } catch (err) {
          actions.showErrorSnackbar(
            'Failed to update description',
            err as Error
          );
        } finally {
          closeInput();
        }
      }
    };

    const addDescription = async () => {
      const actions = sl.get('globalActions');
      isSaving.value = true;
      try {
        await server.createNewPropertyDescriptionField({
          referenceUuid: props.variableOrValueUuid,
          description: newDescription.value,
          primacy: newPrimacy.value,
        });

        await assignNewValues();
        actions.showSnackbar('Successfully added new description');
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to add new description',
          err as Error
        );
      } finally {
        closeInput();
      }
    };

    const assignNewValues = async () => {
      const newProps: FieldInfo = await server.getFieldInfo(
        props.variableOrValueUuid
      );
      newDescription.value = newProps.field ?? 'none';
      newPrimacy.value = newProps.primacy ?? 0;
      newLanguage.value =
        newProps.language === 'default'
          ? 'English'
          : newProps.language || 'n/a';
      reactiveFieldUuid.value = newProps.uuid ?? '';
    };

    const canSubmit = computed(
      () =>
        newDescription.value !== 'none' &&
        newPrimacy.value !== 0 &&
        newDescription.value !== ''
    );
    return {
      isEditing,
      isAdding,
      isSaving,
      saveEdit,
      closeInput,
      newDescription,
      addDescription,
      newLanguage,
      newPrimacy,
      canSubmit,
      reactiveFieldUuid,
    };
  },
});
</script>
