import axios from '../axiosInstance';

async function updatePageContent(pageName: string, content: string) {
  await axios.patch(`/page_content/${pageName}`, content);
}

async function getPageContent(pageName: string): Promise<string> {
  const { data } = await axios.get(`/page_content/${pageName}`);
  console.log(data);
  return data;
}

export default {
  updatePageContent,
  getPageContent,
};
