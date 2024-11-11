// src/utils/tokens.ts
let oauthTokens: any = null;

export const setTokens = (tokens: any) => {
  oauthTokens = tokens;
};

export const getTokens = () => oauthTokens;
