const sendEmail = require("./sendEmail");
const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  //origin is a URL for the frontend
  //in front-end>src>App.js><Route path='/user/verify-email' exact>
  const verifyEmail = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`;
  const message = `<p>Please confirm your email by clicking on the following link: 
   <a href="${verifyEmail}">Verify Email</a></p>`;
  return sendEmail({
    to: email,
    subject: "Email Confirmation",
    html: `<h4>Hello, ${name}</h4> ${message}`,
  });
};

module.exports = sendVerificationEmail;
