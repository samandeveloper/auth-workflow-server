const nodemailer = require("nodemailer");
const nodemailerConfig = require("./nodemailerConfig");

const sendEmail = async ({ to, subject, html }) => {
  //to, subject and html (text or html) are added later
  let testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport(nodemailerConfig);

  return transporter.sendMail({
    from: '"Saman 👻" <saman@example.com>', // sender address
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
