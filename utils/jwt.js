const jwt = require("jsonwebtoken");

const createJWT = ({ payload }) => {
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET
    // {
    // expiresIn: process.env.JWT_LIFETIME,  //if we have jwt in the cookie we can remove the expiresIn because it's going to control by the cookie
    // }
  );
  return token;
};
const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);
const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { user } }); //so in access token we pass user info
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } }); //in refreshToken we pass both user info and refreshToken
  const oneDay = 1000 * 60 * 60 * 24; //one day
  const longerExp = 1000 * 60 * 60 * 24 * 30; //thirty days

  //after adding 2 cookies:
  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneDay),
  });

  //add refreshToken
  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    expires: new Date(Date.now() + longerExp),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};
module.exports = {
  createJWT, //tokrn sign
  isTokenValid, //token verify
  attachCookiesToResponse,
};
