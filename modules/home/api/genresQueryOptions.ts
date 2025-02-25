import axios from "axios";
import { queryOptions } from "@tanstack/react-query";

export const genresQueryOptions = queryOptions({
  queryKey: ["genres"],
  queryFn: async () => {
    const data = await axios.get<{
      code: number;
      data: {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
      }[];
    }>(`${process.env.BACKEND_URL}/public/get-genre-options`);

    return data.data.data;
  },
});
