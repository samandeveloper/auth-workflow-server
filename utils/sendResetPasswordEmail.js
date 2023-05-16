const sendEmail = require("./sendEmail");

const sendResetPasswordEmail = async ({ name, email, token, origin }) => {
  //in verify email the token name was verificationToken
  const resetURL = `${origin}/user/reset-password?token=${token}&email=${email}`; //in front-end>src>App.js><Route path='/user/reset-password' exact>
  const message = `<p>Please reset password by clicking in the following link: 
    <a href="${resetURL}">Reset Password</a>
    </p>`;
  return sendEmail({
    to: email,
    subject: "Reset Password",
    html: `<h4>Hello, ${name}</h4>${message}`,
  });
};

module.exports = sendResetPasswordEmail;
