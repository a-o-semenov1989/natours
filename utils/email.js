const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1)Создаем transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //если gmail - активируем в gmail "less secure app" опцию
  });

  //2) Определяем опции email-a
  const mailOptions = {
    from: 'Anatolii Semenov <email@email.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:
  };

  //3) Отправляем email
  await transporter.sendMail(mailOptions); //возвращает промис
};

module.exports = sendEmail;
