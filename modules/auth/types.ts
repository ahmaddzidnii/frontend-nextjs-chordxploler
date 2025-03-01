export type AuthGoogleCallbackResponse = {
  api_version: string;
  request_id: string;
  kind: string;
  data: {
    access_token: string;
    refresh_token: string;
  };
};

export type AuthUserResposneType = {
  api_version: string;
  request_id: string;
  kind: string;
  data: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    created_at: number;
    updated_at: number;
  };
};

export type AuthLogoutResponseType = {
  api_version: string;
  request_id: string;
  kind: string;
  message: string;
};

export type AuthRefershTokenResponseType = {
  api_version: string;
  request_id: string;
  kind: string;
  data: {
    access_token: string;
  };
};
