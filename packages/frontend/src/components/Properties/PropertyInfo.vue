<template>
  <v-menu
    v-if="(canView2 && newPrimacy === 2) || newPrimacy < 2"
    offset-y
    open-on-click
    :close-on-content-click="false"
    class="info-popover-test"
  >
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" small class="info-icon-test">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3 card-test">
      <span
        ><h3>{{ propertyItem.name }}</h3></span
      >
      <br />
      <span
        v-if="propertyItem.type && ((canAddEdit1 && newPrimacy < 2) || isAdmin)"
        ><b>Variable Type</b>: {{ propertyItem.type
        }}{{
          propertyItem.type === 'link' && propertyItem.tableReference
            ? ` > ${propertyItem.tableReference}`
            : ''
        }}</span
      >
      <div v-if="!isEditing && !isAdding">
        <span>
          <b>Description</b>: {{ newDescription ? newDescription : 'none' }}
        </span>
        <br />
        <span> <b>Primacy</b>: {{ newPrimacy }} </span>
        <br />
        <span><b>Language</b>: {{ newLanguage }}</span>
        <div v-if="(canAddEdit1 && newPrimacy < 2) || isAdmin" class="pt-2">
          <v-btn
            v-if="reactiveFieldUuid"
            class="mr-1 edit-button-test"
            @click="isEditing = true"
            small
            >Edit</v-btn
          >
          <v-btn
            v-else
            class="mr-1 add-button-test"
            @click="isAdding = true"
            small
            >Add Description</v-btn
          >
        </div>
      </div>
      <div
        v-if="
          (isAdding || isEditing) &&
          ((canAddEdit1 && newPrimacy < 2) || isAdmin)
        "
      >
        <span>
          <v-select
            label="Primacy"
            class="new-primacy-test"
            v-model="newPrimacy"
            filled
            :items="isAdmin ? [1, 2] : [1]"
          ></v-select>
          <v-textarea
            label="Description"
            v-model="newDescription"
            class="new-description-test"
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
          >
            <v-icon class="edit-submit-test">mdi-check</v-icon>
          </v-btn>
          <v-btn
            v-if="!isSaving && !reactiveFieldUuid && isAdding"
            icon
            :disabled="!canSubmit"
            @click="addDescription"
          >
            <v-icon class="add-submit-test">mdi-check</v-icon>
          </v-btn>
          <v-btn v-if="!isSaving" icon @click="closeInput" class="close-test">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </span>
      </div>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  Ref,
  ref,
  PropType,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { FieldInfo, PropertyValue, PropertyVariable } from '@oare/types';

export default defineComponent({
  name: 'PropertyInfo',
  props: {
    propertyItem: {
      type: Object as PropType<PropertyVariable | PropertyValue>,
      required: true,
    },
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const store = sl.get('store');
    const actions = sl.get('globalActions');

    const isEditing: Ref<Boolean> = ref(false);
    const isAdding: Ref<Boolean> = ref(false);
    const isSaving: Ref<Boolean> = ref(false);
    const newDescription: Ref<string> = ref(
      props.propertyItem.fieldInfo
        ? props.propertyItem.fieldInfo.field || ''
        : ''
    );
    const newPrimacy: Ref<number> = ref(
      props.propertyItem.fieldInfo
        ? props.propertyItem.fieldInfo.primacy || 0
        : 0
    );
    const newLanguage: Ref<string> = ref(
      props.propertyItem.fieldInfo
        ? props.propertyItem.fieldInfo.language || 'n/a'
        : 'n/a'
    );
    const reactiveFieldUuid: Ref<string> = ref(
      props.propertyItem.fieldInfo
        ? props.propertyItem.fieldInfo.uuid || ''
        : ''
    );

    const closeInput = () => {
      isEditing.value = false;
      isAdding.value = false;
      isSaving.value = false;
    };

    const saveEdit = async () => {
      if (reactiveFieldUuid.value) {
        isSaving.value = true;
        try {
          await server.updatePropertyDescriptionField({
            uuid: reactiveFieldUuid.value,
            description: newDescription.value,
            primacy: newPrimacy.value,
            location: 'taxonomyTree',
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
      try {
        isSaving.value = true;
        await server.createNewPropertyDescriptionField({
          referenceUuid: props.propertyItem.uuid,
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
        props.propertyItem.uuid
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

    const canView2 = computed(() =>
      store.hasPermission('VIEW_FIELD_DESCRIPTION')
    );

    const canAddEdit1 = computed(() =>
      store.hasPermission('ADD_EDIT_FIELD_DESCRIPTION')
    );

    const isAdmin = computed(() => store.getters.isAdmin);

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
      isAdmin,
      canView2,
      canAddEdit1,
    };
  },
});
</script>
