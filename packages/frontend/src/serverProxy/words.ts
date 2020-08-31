import { DictionaryWord } from "@/types/words";
import axios from "../axiosInstance";

async function getDictionaryWords(): Promise<DictionaryWord[]> {
  const { data } = await axios.get("/words");
  return data;
}

export default {
  getDictionaryWords,
};
