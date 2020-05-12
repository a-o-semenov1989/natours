const mongoose = require('mongoose');
const dotenv = require('dotenv');

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
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
