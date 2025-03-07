import { useState } from "react";
import { toast } from "react-toastify";
import { getCookie } from "cookies-next";
import { useQueryClient } from "@tanstack/react-query";

import { COOKIE_NAME_ACCESS_TOKEN } from "@/config/cookies";
import { axiosAuthenticatedInstance } from "@/lib/axiosAuthenticatedInstance";

import { AuthLogoutResponseType } from "../types";

export function useLogout() {
  const [isLoadingLogout, setIsLoadingLogout] = useState(false);

  const queryClient = useQueryClient();

  const logout = ({ onError }: { onError?: (error: unknown) => void }) => {
    setIsLoadingLogout(true);

    const logoutPromise = axiosAuthenticatedInstance.get<AuthLogoutResponseType>(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`,
      {
        headers: {
          Authorization: `Bearer ${getCookie(COOKIE_NAME_ACCESS_TOKEN)}`,
        },
        withCredentials: true,
      }
    );

    toast.promise(logoutPromise, {
      pending: "Logging out...",
      success: "Logged out successfully",
      error: "Failed to logout",
    });

    logoutPromise
      .then(() => {
        setIsLoadingLogout(false);
        queryClient.removeQueries(); // Remove all queries from the cache
        window.location.reload();
      })
      .catch((error) => {
        setIsLoadingLogout(false);
        console.error("Failed to logout:", error);
        onError?.(error);
      });
  };

  return { logout, isLoadingLogout };
}
