import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";

import { AuthUser } from "@/types";
import { COOKIE_NAME_ACCESS_TOKEN, COOKIE_NAME_REFRESH_TOKEN } from "@/config/cookies";
import { AuthRefershTokenResponseType } from "@/modules/auth/types";

interface AuthObject {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

type MiddlewareCallback = (auth: AuthObject, req: NextRequest) => Promise<NextResponse | void>;

const createAuthObject = (isAuthenticated: boolean, user: AuthUser | null): AuthObject => ({
  isAuthenticated,
  user,
});

async function attemptTokenRefresh(refreshToken: string) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
      credentials: "include",
      method: "GET",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Refresh token failed with status: ${response.status}`);
    }

    const data = (await response.json()) as AuthRefershTokenResponseType;
    return data.data.access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
}

export function authMiddleware(callback: MiddlewareCallback) {
  return async (req: NextRequest) => {
    try {
      const accessToken = req.cookies.get(COOKIE_NAME_ACCESS_TOKEN)?.value;
      const refreshToken = req.cookies.get(COOKIE_NAME_REFRESH_TOKEN)?.value;

      // Jika tidak ada kedua token, return unauthenticated
      if (!accessToken && !refreshToken) {
        return callback(createAuthObject(false, null), req);
      }

      // Jika ada refresh token tapi tidak ada access token, coba refresh
      if (!accessToken && refreshToken) {
        try {
          console.log("Access token missing, attempting refresh...");
          const newAccessToken = await attemptTokenRefresh(refreshToken);

          // Verify the new access token
          const { payload } = await jose.jwtVerify(
            newAccessToken,
            new TextEncoder().encode(process.env.JWT_SECRET),
            { algorithms: ["HS256"] }
          );

          // Create response with authenticated user
          const result = await callback(
            createAuthObject(true, {
              id: payload.sub as string,
              name: payload.name as string,
              email: payload.email as string,
              avatar: payload.avatar as string,
              role: payload.role as string,
            }),
            req
          );

          const response = result instanceof NextResponse ? result : NextResponse.next();

          // Set the new access token
          response.cookies.set(COOKIE_NAME_ACCESS_TOKEN, newAccessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });

          return response;
        } catch (refreshError) {
          console.error("Refresh attempt failed:", refreshError);
          const response = await callback(createAuthObject(false, null), req);
          const finalResponse = response instanceof NextResponse ? response : NextResponse.next();

          // Clear both tokens on refresh failure
          finalResponse.cookies.delete(COOKIE_NAME_ACCESS_TOKEN);
          finalResponse.cookies.delete(COOKIE_NAME_REFRESH_TOKEN);

          return finalResponse;
        }
      }

      // Normal flow with access token verification
      try {
        const { payload } = await jose.jwtVerify(
          accessToken!,
          new TextEncoder().encode(process.env.JWT_SECRET),
          { algorithms: ["HS256"] }
        );

        return callback(
          createAuthObject(true, {
            id: payload.sub as string,
            name: payload.name as string,
            email: payload.email as string,
            avatar: payload.avatar as string,
            role: payload.role as string,
          }),
          req
        );
      } catch (error: any) {
        if (error.code === "ERR_JWS_INVALID") {
          // delete the cookies
          const response = await callback(createAuthObject(false, null), req);
          const finalResponse = response instanceof NextResponse ? response : NextResponse.next();

          finalResponse.cookies.delete(COOKIE_NAME_ACCESS_TOKEN);
          finalResponse.cookies.delete(COOKIE_NAME_REFRESH_TOKEN);

          return finalResponse;
        }
        // Handle expired token
        if (error.code === "ERR_JWT_EXPIRED" && refreshToken) {
          console.log("Access token expired, refreshing...");

          try {
            const newAccessToken = await attemptTokenRefresh(refreshToken);

            const { payload } = await jose.jwtVerify(
              newAccessToken,
              new TextEncoder().encode(process.env.JWT_SECRET),
              { algorithms: ["HS256"] }
            );

            const result = await callback(
              createAuthObject(true, {
                id: payload.sub as string,
                name: payload.name as string,
                email: payload.email as string,
                avatar: payload.avatar as string,
                role: payload.role as string,
              }),
              req
            );

            const response = result instanceof NextResponse ? result : NextResponse.next();

            response.cookies.set(COOKIE_NAME_ACCESS_TOKEN, newAccessToken, {
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });

            return response;
          } catch (refreshError) {
            console.error("Refresh token error:", refreshError);
            const response = await callback(createAuthObject(false, null), req);
            const finalResponse = response instanceof NextResponse ? response : NextResponse.next();

            finalResponse.cookies.delete(COOKIE_NAME_ACCESS_TOKEN);
            finalResponse.cookies.delete(COOKIE_NAME_REFRESH_TOKEN);

            return finalResponse;
          }
        }

        return callback(createAuthObject(false, null), req);
      }
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return callback(createAuthObject(false, null), req);
    }
  };
}
