<template>
  <v-row class="mt-4">
    <v-col cols="12">
      <router-link v-if="showRouterLink" :to="`/archives/${archive.uuid}`"
        ><div>
          {{ archive.name }} ({{ archive.totalTexts }} texts |
          {{ archive.totalDossiers }} dossiers)
        </div>
      </router-link>
      <div
        v-if="archive.descriptions.length > 0"
        :class="{ 'ml-5': !allowCUD }"
      >
        <div>
          <b>
            {{
              `${
                archive.descriptions.length > 1 ? 'Descriptions' : 'Description'
              }:`
            }}</b
          >
        </div>
        <div
          v-for="(description, index) in archive.descriptions"
          :key="`description-${index}`"
        >
          <div>
            <span v-if="!isAdding && !isDeleting && !isEditing && allowCUD"
              ><v-btn
                @click="
                  openEdit(
                    description.uuid,
                    description.field,
                    description.primacy,
                    index
                  )
                "
                class="test-edit-description"
                icon
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn></span
            >
            <span v-if="!(index === editingIndex && isEditing)"
              >{{ index + 1 }}. {{ description.field }}</span
            >
            <span v-if="!isAdding && !isDeleting && !isEditing && allowCUD"
              ><v-btn
                @click="
                  openDeleteDialog(
                    description.uuid,
                    description.field,
                    description.primacy
                  )
                "
                class="test-delete-description"
                icon
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn></span
            >
          </div>
          <edit-archive-description
            v-if="index === editingIndex && isEditing && allowCUD"
            :description="updateOrDeleteDescription"
            :primacy="updateOrDeletePrimacy"
            :uuid="updateOrDeleteUuid"
            @close="refreshPage"
          />
        </div>
      </div>
      <div
        class="my-4"
        v-if="!isAdding && !isDeleting && !isEditing && allowCUD"
      >
        <span>
          <v-btn class="test-add-description-button" @click="isAdding = true"
            >Add Description<v-icon>mdi-plus</v-icon></v-btn
          ></span
        >
      </div>
      <add-archive-description
        v-if="isAdding && allowCUD"
        :nextPrimacy="archive.descriptions.length + 1"
        :referenceUuid="archive.uuid"
        @close="refreshPage"
      />
      <div
        :class="{ 'ml-5': !allowCUD }"
        v-if="archive.bibliographyUuid && canViewBibliography"
      >
        <div><b>Bibliography:</b></div>
        <span v-show="!loading" v-html="bibliography"></span>
        <v-progress-circular v-show="loading" indeterminate />
      </div>
      <oare-dialog
        v-model="isDeleting"
        :title="`Remove description '${updateOrDeleteDescription}'?`"
        submitText="Yes"
        cancelText="No"
        :persistent="false"
        @submit="deleteDescription"
        >Are you sure you want to remove this description?</oare-dialog
      >
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import AddArchiveDescription from './AddArchiveDescription.vue';
import EditArchiveDescription from './EditArchiveDescription.vue';
import { ArchiveInfo, BibliographyResponse } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'ArchiveInfo',
  components: {
    AddArchiveDescription,
    EditArchiveDescription,
  },
  props: {
    archive: {
      type: Object as PropType<ArchiveInfo>,
      required: true,
    },
    showRouterLink: {
      type: Boolean,
      default: true,
    },
    allowCUD: {
      type: Boolean,
      default: false,
    },
  },
  setup({ archive }, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const loading = ref(false);
    const bibliography = ref('');
    const isAdding = ref(false);
    const isEditing = ref(false);
    const isDeleting = ref(false);
    const editingIndex = ref(-1);
    const updateOrDeleteDescription = ref('');
    const updateOrDeleteUuid = ref('');
    const updateOrDeletePrimacy = ref(-1);

    const canViewBibliography = computed(() =>
      store.hasPermission('BIBLIOGRAPHY')
    );

    const refreshPage = () => {
      updateOrDeleteUuid.value = '';
      updateOrDeleteDescription.value = '';
      updateOrDeletePrimacy.value = -1;
      editingIndex.value = -1;
      isDeleting.value = false;
      isEditing.value = false;
      isAdding.value = false;
      emit('refresh-page');
    };

    const openEdit = (
      uuid: string,
      description: string,
      primacy: number,
      index: number
    ) => {
      isEditing.value = true;
      updateOrDeleteDescription.value = description;
      updateOrDeleteUuid.value = uuid;
      updateOrDeletePrimacy.value = primacy;
      editingIndex.value = index;
    };

    const openDeleteDialog = (
      uuid: string,
      description: string,
      primacy: number
    ) => {
      isDeleting.value = true;
      updateOrDeleteDescription.value = description;
      updateOrDeleteUuid.value = uuid;
      updateOrDeletePrimacy.value = primacy;
    };

    const deleteDescription = async () => {
      try {
        await server.deletePropertyDescriptionField({
          uuid: updateOrDeleteUuid.value,
          referenceUuid: archive.uuid,
          primacy: updateOrDeletePrimacy.value,
          type: 'description',
        });
      } catch (err) {
        actions.showErrorSnackbar(
          'unable to delete selected description',
          err as Error
        );
      } finally {
        refreshPage();
      }
    };

    onMounted(async () => {
      if (archive.bibliographyUuid && canViewBibliography.value) {
        loading.value = true;
        try {
          const bibliographyResponse: BibliographyResponse = await server.getBibliography(
            archive.bibliographyUuid
          );
          bibliography.value = bibliographyResponse.bibliography.bib!!;
        } catch (err) {
          actions.showErrorSnackbar(
            'Unable to get bibliography information',
            err as Error
          );
        } finally {
          loading.value = false;
        }
      }
    });
    return {
      canViewBibliography,
      loading,
      bibliography,
      refreshPage,
      isEditing,
      isAdding,
      isDeleting,
      openDeleteDialog,
      updateOrDeleteDescription,
      updateOrDeleteUuid,
      updateOrDeletePrimacy,
      deleteDescription,
      openEdit,
      editingIndex,
    };
  },
});
</script>
