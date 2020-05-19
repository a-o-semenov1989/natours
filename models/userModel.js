const mongoose = require('mongoose');
const validator = require('validator'); //библиотека с валидаторами и санитаизерами
const bcrypt = require('bcryptjs'); //библиотека для шифрования

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name.'],
    maxlength: [40, 'A name must have less or equal then 40 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, //трансформирует имейл в lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Plesase provide a password'],
    minlength: [8, 'A password must be at least 8 characters'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //Работает только с SAVE и CREATE
      validator: function (el) {
        return el === this.password; //проверяем совпадает ли введенный пароль с повторно введенным паролем, если ок - вернет true
      },
      message: 'Passwords are not the same!',
    },
  },
});

userSchema.pre('save', async function (next) {
  //Запускается если пароль изменен
  if (!this.isModified('password')) return next(); //document middleware, this - текущий документ (current user) //если поле password не изменяется - вернутся из функции и запустить следующий middleware// запустить перед сохранением в БД

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12); //хэшируем пароль //12, 2 агумент - cost parameter для salt, разбавления пароля строкой. насколько CPU intensive будет эта операция //async версия функции, вернет промис

  this.passwordConfirm = undefined; //удаляем поле с проверочным паролем, чтобы он не сохранился в БД, оригинальный уже хэширован //он required для инпута, а не для сохранения в БД
  next();
});

const User = mongoose.model('User', userSchema); //создаем модель, передается нужное имя и схема

module.exports = User;
