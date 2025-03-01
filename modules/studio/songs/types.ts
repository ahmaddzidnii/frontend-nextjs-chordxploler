import { ApiResponseWithoutPaginationType } from "@/types";

export type SogInfoResponseType = ApiResponseWithoutPaginationType<{
  id: string;
  user_id: string;
  title: string;
  artist: string[];
  slug: string;
  status: string;
  genres: {
    id: string;
    name: string;
  }[];
  cover: string;
  youtube_url: string;
  released_year: number;
  publisher: string;
  bpm: number;
  sections: any[];
  keys: {
    id: string;
    key: string;
    family_name: string;
    family: string;
  }[];
  created_at: string;
  updated_at: string;
}>;

export type SongGetManyResponseType = {
  api_version: string;
  request_id: string;
  data: {
    kind: string;
    current_item_count: number;
    items_per_page: number;
    current_page: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
    songs: {
      id: string;
      kind: string;
      user_id: string;
      title: string;
      artists: string[];
      slug: string;
      visibility: string;
      genres: any[];
      cover: string;
      youtube_url: string;
      released_year: number;
      publisher: string;
      bpm: number;
      keys: {
        id: string;
        key: string;
        family_name: string;
        family: string;
      }[];
      statistics: {
        view_count: number;
        like_count: number;
        dislike_count: number;
        share_count: number;
        comment_count: number;
      };
      created_at: string;
      updated_at: string;
    }[];
  };
};
