import axios from "../axiosInstance";
import { SearchResult } from "@/types/search";

async function searchTexts(searchChars: string[], textTitle: string,
  { page, rows }: { page: number, rows: number }): Promise<SearchResult> {
  const params: {
    page: number,
    rows: number,
    textTitle: string,
    characters?: string[]
  } = {
    page,
    rows,
    textTitle
  };

  if (searchChars.length > 0) {
    params.characters = searchChars;
  }
  let { data } = await axios.get("/search", {
    params
  });
  return data;
}

export default {
  searchTexts
};
