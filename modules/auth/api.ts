import axios from "axios";
import { getCookie, setCookie, deleteCookie } from "cookies-next";

import { COOKIE_NAME_ACCESS_TOKEN, COOKIE_NAME_REFRESH_TOKEN } from "@/config/cookies";
import { AuthRefershTokenResponseType } from "./types";

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

// Function to refresh token
const refreshAccessToken = async () => {
  try {
    const response = await axios.get<AuthRefershTokenResponseType>(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
      {
        withCredentials: true,
      }
    );

    const { access_token } = response.data.data;

    // Update cookies with new tokens
    setCookie(COOKIE_NAME_ACCESS_TOKEN, access_token);

    return access_token;
  } catch (error) {
    console.error("Failed to refresh token", error);
    throw error;
  }
};

// Axios interceptor
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = getCookie(COOKIE_NAME_REFRESH_TOKEN);
    if (refreshToken) {
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Mark this request as retried

        try {
          const newAccessToken = await refreshAccessToken();
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return api(originalRequest); // Retry the original request with the new token
        } catch (refreshError) {
          console.error("Refresh token failed", refreshError);
          deleteCookie(COOKIE_NAME_ACCESS_TOKEN);
          return Promise.reject(refreshError);
        }
      }
    } else {
      deleteCookie(COOKIE_NAME_ACCESS_TOKEN);
      deleteCookie(COOKIE_NAME_REFRESH_TOKEN);
    }

    return Promise.reject(error);
  }
);

export default api;
