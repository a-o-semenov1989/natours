const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' }); //путь для фаила с конфигурациеи //прочитав фаил один раз - доступ к process будет везде

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

//READ JSON FILE
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //по завершению выйти из процесса
};

//DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //по завершению выйти из процесса
};

if (process.argv[2] === '--import') {
  //если третий элемент в массиве process.argv[2] - --import - импортировать данные
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

//console.log(process.argv); //массив аргументов работающего node процесса
