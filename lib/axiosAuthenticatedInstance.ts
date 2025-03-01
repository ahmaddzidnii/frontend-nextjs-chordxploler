import axios from "axios";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { COOKIE_NAME_ACCESS_TOKEN, COOKIE_NAME_REFRESH_TOKEN } from "@/config/cookies";

export const axiosAuthenticatedInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
  timeout: 1000 * 10 * 3, // 30 seconds
});

// Keep track of the refresh token request to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [] as any[];

// Process the queue of failed requests
const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Function to refresh token
const refreshAccessToken = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
      withCredentials: true,
    });

    const { access_token } = response.data.data;
    setCookie(COOKIE_NAME_ACCESS_TOKEN, access_token);
    return access_token;
  } catch (error) {
    console.error("Failed to refresh token", error);
    throw error;
  }
};

// Silent logout - just clear the tokens without redirecting
const silentLogout = () => {
  deleteCookie(COOKIE_NAME_ACCESS_TOKEN);
  deleteCookie(COOKIE_NAME_REFRESH_TOKEN);
  // No redirect here
};

// Full logout with redirect (use this when you want to force login)
const fullLogout = () => {
  silentLogout();
  window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL ?? "/auth/login";
};

// Axios interceptor
axiosAuthenticatedInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized error
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, add this request to the queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosAuthenticatedInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();

        // Update the authorization header
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Process all the requests in the queue
        processQueue(null, newAccessToken);

        // Reset refreshing state
        isRefreshing = false;

        // Retry the original request with the new token
        return axiosAuthenticatedInstance(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, silently logout without redirect
        console.error("Refresh token failed", refreshError);
        silentLogout();

        // Process failed queue
        processQueue(refreshError, null);

        // Reset refreshing state
        isRefreshing = false;

        // Return the original 401 error
        return Promise.reject(error);
      }
    }

    // For all other errors, just reject the promise
    return Promise.reject(error);
  }
);

// Event handler to check auth status (can be used with UI components)
export const checkAuthStatus = () => {
  const accessToken = getCookie(COOKIE_NAME_ACCESS_TOKEN);
  const refreshToken = getCookie(COOKIE_NAME_REFRESH_TOKEN);

  return {
    isAuthenticated: !!accessToken,
    hasRefreshToken: !!refreshToken,
  };
};

// Optional: Function to manually trigger a logout with redirect
export const logoutUser = () => {
  fullLogout();
};

// import axios from "axios";
// import { deleteCookie, getCookie, setCookie } from "cookies-next";
// import { COOKIE_NAME_ACCESS_TOKEN, COOKIE_NAME_REFRESH_TOKEN } from "@/config/cookies";

// export const axiosAuthenticatedInstance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
//   withCredentials: true,
//   timeout: 1000 * 10 * 3, // 30 seconds
// });

// // Function to refresh token
// const refreshAccessToken = async () => {
//   try {
//     const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
//       withCredentials: true,
//     });

//     const { access_token } = response.data.data;
//     setCookie("access_token", access_token);
//     return access_token;
//   } catch (error) {
//     console.error("Failed to refresh token", error);
//     throw error;
//   }
// };

// // Function to handle logout
// const handleLogout = () => {
//   deleteCookie(COOKIE_NAME_ACCESS_TOKEN);
//   deleteCookie(COOKIE_NAME_REFRESH_TOKEN);
//   window.location.href = process.env.NEXT_PUBLIC_LOGIN_URL ?? "/auth/login";
// };

// // Axios interceptor
// axiosAuthenticatedInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Handle 401 Unauthorized error
//     if (error.response?.status === 401) {
//       const refreshToken = getCookie(COOKIE_NAME_REFRESH_TOKEN);

//       // If we have a refresh token and haven't retried yet
//       if (refreshToken && !originalRequest._retry) {
//         originalRequest._retry = true;
//         try {
//           const newAccessToken = await refreshAccessToken();
//           originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
//           return axiosAuthenticatedInstance(originalRequest);
//         } catch (refreshError) {
//           // If refresh token fails, logout user
//           console.error("Refresh token failed", refreshError);
//           handleLogout();
//           return Promise.reject(refreshError);
//         }
//       } else {
//         // No refresh token or already retried, logout user
//         handleLogout();
//         return Promise.reject(error);
//       }
//     }

//     // For all other errors, just reject the promise
//     return Promise.reject(error);
//   }
// );
