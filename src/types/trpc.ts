export type AuthLoginInput = {
  email: string;
  password: string;
};

export type AuthLoginOutput = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
  };
};
