import axios from '@/axiosInstance';
import { UploadImageDataPayload } from '@oare/types';

async function uploadImageData(payload: UploadImageDataPayload): Promise<void> {
  await axios.post('/resource/images', payload);
}

async function uploadImage(name: string, file: File) {
  const formData = new FormData();
  formData.append('newFile', file, 'newFile');

  await axios.post(`/resource/upload_image/${name}`, formData);
}

export default {
  uploadImageData,
  uploadImage,
};
