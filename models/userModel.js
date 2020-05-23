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
    select: false, //так не покажет пароль по запросу к API
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
  passwordChangedAt: Date,
});

userSchema.pre('save', async function (next) {
  //Запускается если пароль изменен
  if (!this.isModified('password')) return next(); //document middleware, this - текущий документ (current user) //если поле password не изменяется - вернутся из функции и запустить следующий middleware// запустить перед сохранением в БД

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12); //хэшируем пароль //12, 2 агумент - cost parameter для salt, разбавления пароля строкой. насколько CPU intensive будет эта операция //async версия функции, вернет промис

  this.passwordConfirm = undefined; //удаляем поле с проверочным паролем, чтобы он не сохранился в БД, оригинальный уже хэширован //он required для инпута, а не для сохранения в БД
  next();
});

//instance method - доступен на всех документах конкретной коллекции
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //принимает пароль переданный при логине и пароль из БД
  return await bcrypt.compare(candidatePassword, userPassword); //this.password - не доступен, потому что у password select: false //candidatePassword не хэширован, поэтому мы не можем сравнить напрямую //compare возвращает true или false
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //дату в таймстамп конвертируем для сравнения в секунды, делим на 1000 чтобы получить милисекунды

    //console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; //если время выпуска токена было раньше чем изменения пароля - вернуть true
  }
  //this - текущий документ //если поле passwordChangedAt существует - проводим сравнение, если поля не существует - пользователь не менял пароль

  return false;
}; //по умолчанию возвращается false, что значит что пользователь не менял пароль после выписки токена

const User = mongoose.model('User', userSchema); //создаем модель, передается нужное имя и схема

module.exports = User;
