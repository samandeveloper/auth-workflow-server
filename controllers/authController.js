const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
  createHash,
} = require("../utils");
const crypto = require("crypto"); //to create a fake token (verificationToken)
//Now we can remove the sendEmail since sendEmail is imported in the sendVerificationEmail
// const sendEmail = require('../utils/sendEmail')
const Token = require("../models/Token"); //for creating refreshToken

const register = async (req, res) => {
  const { email, name, password } = req.body;
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }
  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  //create a fake token then send that token to the user variable
  const verificationToken = crypto.randomBytes(40).toString("hex"); //create token
  //add the verificationToken to the user variable
  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken, //add the fake token
  });

  const origin = "http://localhost:3000"; //this is a frontend URL
  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    token: user.passwordToken,
    origin,
  });
  res.status(StatusCodes.CREATED).json({
    msg: "Success, please check your email to verify account",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email }); //find a user with her/his email
  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  //check if the user is verified after registering (user.isVerified)
  if (!user.isVerified) {
    throw new CustomError.UnauthenticatedError("Please verify your email");
  }
  const tokenUser = createTokenUser(user); //real token
  //create refresh token--a cookie/token
  let refreshToken = "";
  //check if there is an existing token for user (after adding 2 cookies)
  const existingToken = await Token.findOne({ user: user._id }); //find _id in users collection
  if (existingToken) {
    const { isValid } = existingToken; //pullout isValid from the existingToken (find the isValid from the user._id)
    if (!isValid) {
      throw new CustomError.UnauthenticatedError("Invalid credentials");
    }
    refreshToken = existingToken.refreshToken; //if isValid is true
    console.log(refreshToken); 
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser });
    return; 
  }

  //create refreshToken--in this step user login and we want to setup 2 cookies (refreshToken and accessToken)
  refreshToken = crypto.randomBytes(40).toString("hex");
  //setup user agent
  const userAgent = req.headers["user-agent"]; //to access sth in the header of req we can use .get or .header[]
  //get ip address
  const ip = req.ip;
  //create an object with the above properties (refreshToken, ip, userAgent). we also have user in the Token model
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);
  attachCookiesToResponse({ res, user: tokenUser, refreshToken }); //refreshToken is another cookie we set
  res.status(StatusCodes.OK).json({ user: tokenUser, token });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId }); //add this line

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

//verifyEmail will send from our frontend
const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;
  //find a user using her email
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }
  if (user.verificationToken !== verificationToken) {
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }
  //if user exists and verified
  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = ""; //after verifing the user we set the fake token to the empty string since the token should work once

  await user.save(); //we should save everything we change in user
  res.status(StatusCodes.OK).json({ msg: "Email verified" });
};

//Forgot/Reset Password Functionality
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError("Please provide valid email");
  }
  //if user exists (email exists)
  const user = await User.findOne({ email });
  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");
    //send reset password email to the user
    const origin = "http://localhost:3000"; //this is a frontend URL
    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      token: passwordToken,
      origin,
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes); //passwordTokenExpirationDate means user have 10 minutes to reset the password
    //update the user
    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save(); //now save the user and invoke it
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Please check your email for reset password link" });
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body; //since the reset password page needs password also in it's url page we have token and email
  if (!token || !email || !password) {
    throw new CustomError.BadRequestError("Please provide all value");
  }
  const user = await User.findOne({ email });
  if (user) {  //if that email exists in DB
    const currentDate = new Date();
    if (
      user.passwordToken === createHash(token) &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    }
  }
  res.send("reset password");
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
