import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

export const recommendationsInfiniteQueryOptions = queryOptions({
  queryKey: ["recommendations"],
  queryFn: async ({ pageParam }) => {
    const data = await axios.get(`${process.env.BACKEND_URL}/public/recommendations`, {
      params: {
        cursor: pageParam,
      },
    });

    return data.data;
  },
});
