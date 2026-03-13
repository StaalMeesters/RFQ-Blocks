import { LogLevel } from '@azure/msal-browser';

export const msalConfig = {
  auth: {
    clientId: 'c2e1b443-4fd2-4609-9457-b74dc9dcf8c3',
    authority: 'https://login.microsoftonline.com/33cedb1d-0381-483b-bbce-1010b20f1688',
    redirectUri: window.location.origin + '/RFQ-Blocks/',
    postLogoutRedirectUri: window.location.origin + '/RFQ-Blocks/',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
};
