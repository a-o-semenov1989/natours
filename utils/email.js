const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text'); //convert html to text

module.exports = class Email {
  //class from wich we can create email objects, that we can use to send actual emails
  constructor(user, url) {
    //new Email будет принимать user и url (that we want to be in that email)
    //assign all of this to the current object
    this.to = user.email; // email из юзера - куда отправлять
    this.firstName = user.name.split(' ')[0]; //первый элемент разделенной строки имени - first name
    this.url = url; //например для резета пароля
    this.from = `Anatolii Semenov <${process.env.EMAIL_FROM}>`; //от кого
  }

  //Создаем transports for different environments
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid
      return 1;
    }

    //Если в не в продакшн - значит в дев
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      //если gmail - активируем в gmail "less secure app" опцию
    });
  }

  //Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/..views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    }); //render pug code into real html

    // 2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html), //convert html to text, some people prefer simple text emails
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions); //возвращает промис
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }
};

/* old code
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
  

  //3) Отправляем email
  await transporter.sendMail(mailOptions); //возвращает промис
};

module.exports = sendEmail;
*/
