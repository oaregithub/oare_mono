import {
  EpigraphyResponse,
  TranslitOption,
  UpdateTranslitStatusPayload,
  CreateTextTables,
  CreateTextsPayload,
  TextPhotoWithName,
} from '@oare/types';
import baseAxios from 'axios';
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

const createText = async (createTextTables: CreateTextTables) => {
  const payload: CreateTextsPayload = {
    tables: createTextTables,
  };
  await axios.post('/text_epigraphies/create', payload);
};

const uploadImages = async (photos: TextPhotoWithName[]) => {
  photos.forEach(async photo => {
    const { data: url } = await axios.get(
      `/text_epigraphies/upload_image/${photo.name}`
    );
    // Must use base axios to avoid header conflicts with AWS signing
    await baseAxios.put(url, photo.upload);
  });
};

async function getTextLinkByTextUuid(uuid: string) {
  const { data } = await axios.get(`/text_epigraphies/text_link/${uuid}`);
  return data;
}

async function getTextFileByLink(url: string) {
  //const { data } = await axios.get(`/text_epigraphies/text_file/${url}`);
  //const { data } = await baseAxios.get(url, {headers: {'Access-Control-Allow-Origin': '*',}});
  //return data;
  return '';
}

export default {
  getEpigraphicInfo,
  getImageLinks,
  getTranslitOptions,
  updateTranslitStatus,
  getNextImageDesignator,
  createText,
  uploadImages,
  updateTextInfo,
  getTextLinkByTextUuid,
  getTextFileByLink,
};
