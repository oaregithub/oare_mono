import axios from '../axiosInstance';

/**
 * @typedef TextResult
 * @property {string} uuid The hierarchy UUID of the text
 * @property {string} name The name of the text
 */
/**
 * Search texts in the database by their name.
 * @param {string} searchText A string that should be a substring of the name of the texts desired
 * @returns {Promise<TextResult[]>} A list of matching texts
 */
async function searchTextNames(searchText) {
  const { data } = await axios.get('/search_text_names', {
    params: {
      search: searchText
    }
  });
  return data;
}

export default {
  searchTextNames
};
