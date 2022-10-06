import {
  EpigraphyResponse,
  TranslitOption,
  UpdateTranslitStatusPayload,
  CreateTextTables,
  CreateTextsPayload,
  TextPhotoWithDetails,
  ResourceRow,
  LinkRow,
  EpigraphyLabelLink,
  InsertItemPropertyRow,
} from '@oare/types';
import axios from '../axiosInstance';

async function getEpigraphicInfo(
  textUuid: string,
  forceAllowAdminView?: boolean
): Promise<EpigraphyResponse> {
  const { data } = await axios.get(`/text_epigraphies/text/${textUuid}`, {
    params: {
      forceAllowAdminView,
    },
  });
  return data;
}

async function getTranslitOptions(): Promise<TranslitOption[]> {
  const { data } = await axios.get('/text_epigraphies/transliteration');
  return data;
}

async function updateTranslitStatus(
  textUuid: string,
  color: string
): Promise<void> {
  const payload: UpdateTranslitStatusPayload = {
    textUuid,
    color,
  };
  await axios.patch('/text_epigraphies/transliteration', payload);
}

async function updateTextInfo(
  textUuid: string,
  excavationPrfx: string | null,
  excavationNo: string | null,
  museumPrfx: string | null,
  museumNo: string | null,
  publicationPrfx: string | null,
  publicationNo: string | null
) {
  await axios.patch('/text_epigraphies/edit_text_info', {
    uuid: textUuid,
    excavationPrefix: excavationPrfx,
    excavationNumber: excavationNo,
    museumPrefix: museumPrfx,
    museumNumber: museumNo,
    publicationPrefix: publicationPrfx,
    publicationNumber: publicationNo,
  });
}

async function getImageLinks(
  textUuid: string,
  cdliNum: string | null
): Promise<EpigraphyLabelLink[]> {
  const { data } = await axios.get(
    `/text_epigraphies/images/${textUuid}/${cdliNum}`
  );
  return data;
}

const getNextImageDesignator = async (preText: string): Promise<number> => {
  const { data } = await axios.get(`/text_epigraphies/designator/${preText}`);
  return data;
};

const addPhotosToText = async (
  resources: ResourceRow[],
  links: LinkRow[],
  itemProperties: InsertItemPropertyRow[]
) => {
  await axios.post('/text_epigraphies/additional_images', {
    resources,
    links,
    itemProperties,
  });
};

const createText = async (createTextTables: CreateTextTables) => {
  const payload: CreateTextsPayload = {
    tables: createTextTables,
  };
  await axios.post('/text_epigraphies/create', payload);
};

const uploadImage = async (photo: TextPhotoWithDetails) => {
  const file = photo.upload;
  if (file) {
    const formData = new FormData();
    formData.append('newFile', file, 'newFile');

    await axios.post(`/text_epigraphies/upload_image/${photo.name}`, formData);
  }
};

async function getTextSourceFile(textUuid: string): Promise<string | null> {
  const { data } = await axios.get(`/text_epigraphies/text_source/${textUuid}`);
  return data;
}

async function getResourceObject(tag: string): Promise<string | null> {
  const { data } = await axios.get(`/text_epigraphies/resource/${tag}`);
  return data;
}

async function hasEpigraphy(textUuid: string): Promise<boolean> {
  const { data } = await axios.get(
    `/text_epigraphies/has_epigraphy/${textUuid}`
  );
  return data;
}

export default {
  getEpigraphicInfo,
  getImageLinks,
  getTranslitOptions,
  updateTranslitStatus,
  getNextImageDesignator,
  createText,
  uploadImage,
  updateTextInfo,
  addPhotosToText,
  getTextSourceFile,
  getResourceObject,
  hasEpigraphy,
};
