const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

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
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); //передаем опцию, отключение валидаторов перед сохранением
    await Review.create(reviews);
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
    await User.deleteMany();
    await Review.deleteMany();
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
