import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { AuthGoogleCallbackResponse } from "../types";

export function useLoginWithGoogle() {
  const login = () => {
    const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirect_uri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL;

    if (!client_id || !redirect_uri) {
      console.error("Google Client ID atau Redirect URI tidak ditemukan.");
      return;
    }

    const googleLoginUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=email%20profile&prompt=select_account&access_type=offline`;

    window.location.href = googleLoginUrl;
  };

  const handleCallback = (code: string) => {
    return useQuery({
      queryKey: ["google", "callback"],
      retry: false,
      queryFn: async () => {
        const response = await axios.get<AuthGoogleCallbackResponse>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/oauth/google/callback`,
          {
            params: { code },
            withCredentials: true,
          }
        );

        return response.data.data.access_token;
      },
    });
  };

  return { login, handleCallback };
}
