export type LoginReq = {
  username: string;
  password: string;
};

export type SignupReq = {
  username: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
};

export type TokenReq = {
  refreshToken: string;
};

export type UsersRes = {
  accessToken: string;
  refreshToken: string;
};
