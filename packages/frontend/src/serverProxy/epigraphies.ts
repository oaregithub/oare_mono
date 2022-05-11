import {
  EpigraphyResponse,
  TranslitOption,
  UpdateTranslitStatusPayload,
  CreateTextTables,
  CreateTextsPayload,
  TextPhotoWithName,
  ResourceRow,
  LinkRow,
} from '@oare/types';
import axios from '../axiosInstance';

async function getEpigraphicInfo(textUuid: string): Promise<EpigraphyResponse> {
  const { data } = await axios.get(`/text_epigraphies/text/${textUuid}`);
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
): Promise<string[]> {
  const { data } = await axios.get(
    `/text_epigraphies/images/${textUuid}/${cdliNum}`
  );
  return data;
}

const getNextImageDesignator = async (preText: string): Promise<number> => {
  const { data } = await axios.get(`/text_epigraphies/designator/${preText}`);
  return data;
};

const addPhotosToText = async (resources: ResourceRow[], links: LinkRow[]) => {
  await axios.post('/text_epigraphies/additional_images', {
    resources,
    links,
  });
};

const createText = async (createTextTables: CreateTextTables) => {
  const payload: CreateTextsPayload = {
    tables: createTextTables,
  };
  await axios.post('/text_epigraphies/create', payload);
};

const uploadImage = async (photo: TextPhotoWithName) => {
  const file = photo.upload;
  if (file) {
    const formData = new FormData();
    formData.append('newFile', file, 'newFile');

    await axios.post(`/text_epigraphies/upload_image/${photo.name}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

async function getTextFileByTextUuid(uuid: string) {
  const { data } = await axios.get(`/text_epigraphies/text_file/${uuid}`);
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
  getTextFileByTextUuid,
  hasEpigraphy,
};
