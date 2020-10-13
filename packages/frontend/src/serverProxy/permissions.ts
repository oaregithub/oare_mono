import axios from '../axiosInstance';

interface DictionaryPermissions {
  canEdit: boolean;
}
const getDictionaryPermissions = async (): Promise<DictionaryPermissions> => {
  const { data } = await axios.get('/permissions/dictionary');
  return data;
};

export default {
  getDictionaryPermissions,
};
