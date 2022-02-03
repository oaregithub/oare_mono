import { PublicationResponse } from '@oare/types';
import axios from '../axiosInstance';

/**
 * Returns the list of collections in the corpus
 */
async function getAllPublications(): Promise<PublicationResponse[]> {
  const { data } = await axios.get('/publications');
  return data;
}

/**
 * Returns the texts in a given collection
 */

export default {
  getAllPublications,
};
