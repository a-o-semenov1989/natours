const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  //при uncaught exception (все ошибки в синхронном коде, нигде не обработанные) //должен быть выше всего кода, чтобы отловить ошибки если они выше него (перед app)
  console.log('UNCAUGHT EXCEPTION. Shutting down...');
  console.log(err.name, err.message);
  process.exit(1); //выключаем приложение в случае ошибки //0 - success, 1 - uncaught exception.
});

dotenv.config({ path: './config.env' }); //путь для фаила с конфигурациеи //прочитав фаил один раз - доступ к process будет везде
const app = require('./app');

//console.log(process.env); //список переменных НОД для внутреннего пользования

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
); //заменяем плэисхолдер пароля на пароль из переменнои среды, заданнои в config.env

mongoose
  .connect(DB, {
    //для deprecation warnings //коннект вернет промис
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  //при unhadled rejected promise сработает, получит эррор и отобразит в консоли
  console.log('UNHANDLED REJECTION. Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); //выключаем приложение в случае ошибки, например БД не подключилась //0 - success, 1 - uncaught exception. ||перед тем как выключить приложение нам нужно сперва выключить сервер. Таким образом мы даем серверу время на обработку незавершенных запросов и только после этого он выключиться
  });
});
