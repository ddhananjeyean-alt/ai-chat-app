export const msalConfig = {
  auth: {
    clientId: "72a017e8-994e-4f4a-8f30-92060eb376c1",
    authority: "https://login.microsoftonline.com/5c79e56c-08de-4ce7-b299-6942efff48f9",
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
