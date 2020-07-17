const crypto = require('crypto'); //встроенный модуль
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
  photo: {
    type: String,
    default: 'default.jpg', //фото по-умолчанию
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
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
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //Запускается если пароль изменен
  if (!this.isModified('password')) return next(); //document middleware, this - текущий документ (current user) //если поле password не изменяется - вернутся из функции и запустить следующий middleware// запустить перед сохранением в БД

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12); //хэшируем пароль //12, 2 агумент - cost parameter для salt, разбавления пароля строкой. насколько CPU intensive будет эта операция //async версия функции, вернет промис

  //Delete passwordConfirm field
  this.passwordConfirm = undefined; //удаляем поле с проверочным паролем, чтобы он не сохранился в БД, оригинальный уже хэширован //он required для инпута, а не для сохранения в БД
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); //если не модицифицировали своиство password или документ новыи - выити из фыункции и запустить следующии middleware

  this.passwordChangedAt = Date.now() - 1000; //если пароль поменялся - обновить своиство текущим временем //-1 секунда, потому что иногда токен может быть выписан после изменения своиства со временем изменения пароля и тогда клиент не сможет залогинится с этим токеном
  next();
});

userSchema.pre(/^find/, function (next) {
  //регулярка, все что начинается с файнд //убираем неактивных пользователей из поиска (они должны выглядеть удаленными)
  //this - указывает на текущий query
  this.find({ active: { $ne: false } }); //не искать неактивных пользователей
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

//instance method - доступен на всех документах конкретной коллекции
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); //создаем рандомныи токен с помощью встроенного модуля crypto, передаем количство баит для генерации //конвертируем в hex строку

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //хэшируем ресет токен. //не храним plain reset token в ДБ, поскольку злоумышленник может получить к нему доступ и получить доступ к аккаунту

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //текущее время + 10 минут в милисекундах (10 минут * 60 секунд * 1000 милисекунд)

  return resetToken; //возвращаем ресет токен для дальнеишеи отправки. зашифрованныи хранится в БД, а не зашифрованныи отправляется клиенту для дальнеишего сравнения
};

const User = mongoose.model('User', userSchema); //создаем модель, передается нужное имя и схема

module.exports = User;
