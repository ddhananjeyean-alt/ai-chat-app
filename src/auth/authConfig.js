export const msalConfig = {
  auth: {
    clientId: "72a017e8-994e-4f4a-8f30-92060eb376c1",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    "offline_access",
    "User.Read"
  ],
  prompt: "select_account",
};
