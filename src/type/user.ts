export type SignupReq = {
  username: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
};

export type UsersRes = {
  accessToken: string;
  refreshToken: string;
};
