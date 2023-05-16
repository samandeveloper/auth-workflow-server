const CustomError = require("../errors");
const { isTokenValid } = require("../utils");
const Token = require("../models/Token"); //after we add 2 tokens
const { attachCookiesToResponse } = require("../utils"); //after we add 2 tokens

const authenticateUser = async (req, res, next) => {
  //adding two cookies (accessToken and refreshToken)
  const { refreshToken, accessToken } = req.signedCookies; //cookies are in req.signedCookies
  try {
    //after adding 2 cookies
    if (accessToken) {
      const payload = isTokenValid(accessToken); //isTokenValid is verify token in jwt.js
      req.user = payload.user;
      return next(); //pass to the next middleware
    }
    //refreshToken
    const payload = isTokenValid(refreshToken);
    //check if refreshToken exists and isValid is true
    const existingToken = await Token.findOne({
      //we pass the user and refreshToken since in jwt for refreshTokenJWT we pass user and refreshToken
      user: payload.user.userId,
      refreshToken: payload.refreshToken,
    });
    if (!existingToken || !existingToken?.isValid) {
      throw new CustomError.UnauthenticatedError("Authentication Invalid");
    }
    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });
    req.user = payload.user;
    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        "Unauthorized to access this route"
      );
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
