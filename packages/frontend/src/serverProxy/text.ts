import axios from '@/axiosInstance';
import {
  EditTextInfoPayload,
  TextTransliterationStatus,
  UpdateTextTransliterationStatusPayload,
} from '@oare/types';

async function getTransliterationOptions(): Promise<
  TextTransliterationStatus[]
> {
  const { data } = await axios.get('/text/transliteration');
  return data;
}

async function updateTransliterationStatus(
  payload: UpdateTextTransliterationStatusPayload
): Promise<void> {
  await axios.patch('/text/transliteration', payload);
}

async function updateTextInfo(
  uuid: string,
  payload: EditTextInfoPayload
): Promise<void> {
  await axios.patch(`/text/${uuid}`, payload);
}

export default {
  getTransliterationOptions,
  updateTransliterationStatus,
  updateTextInfo,
};
