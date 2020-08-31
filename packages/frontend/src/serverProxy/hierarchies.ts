import axios from "../axiosInstance";
import { Hierarchy } from "../types/hierarchies";

async function getBaseHierarchies(): Promise<Hierarchy[]> {
  const { data } = await axios.get("/hierarchies");
  return data;
}

async function getHierarchyChildren(item: {
  uuid: string;
  children: Hierarchy[];
}): Promise<Hierarchy[]> {
  const { data: children } = await axios.get<Hierarchy[]>(
    `/hierarchies/${item.uuid}`
  );
  children.forEach((c) => {
    if (c.numChildren > 0) {
      c.children = [];
    }
    item.children.push(c);
  });
  return children;
}

export default {
  getHierarchyChildren,
  getBaseHierarchies,
};
