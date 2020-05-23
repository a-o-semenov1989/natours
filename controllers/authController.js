const { promisify } = require('util'); //встроенный модуль импортируем промисификацию
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync'); //чтобы не писать try-catch block используем catchAsync
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); //создаем токен. 1 аргумент - Payload, у нас id - { id: id }. 2 аргумент строка - секрет (в config.env - должен быть 32 или больше символов)// 3 token header создатся автоматически, но передадим опции 3 аргументом через сколько токен будет просрочен
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    photo: req.body.photo,
  }); //данные получаем из req.body и создаем нового пользователя по нашей модели, которая базируется на схеме //нельзя просто req.body, нужно указывать какие именно поля, которые мы позволяем и которые нужно положить в нового пользователя, так пользователь не сможет зарегистрироваться как админ, поскольку поле с ролью не пойдет в newUser

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token, //отправляем токен клиенту
    data: {
      user: newUser,
    },
  }); //201 - успех. отправляем данные клиенту
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // req.body.email req.body.password //пользователь отправляет данные на проверку

  //1) Проверить существуют ли имейл и пароль
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2) Проверить 1. Существует ли пользователь. 2. Верен ли пароль
  const user = await User.findOne({ email }).select('+password'); //ищем в БД по имейлу //email: email //поле password изначально убрано для показа, чтобы получить его в output делаем select('+password')

  if (!user || !(await user.correctPassword(password, user.password))) {
    //если пользователя не существует и correct = false. Если пользователя не существует, проверка на пароль не ведется.
    //correctPassword - instance method - доступен на всех документах конкретной коллекции (User здесь). Передаем 2 аргумента - пароль-кандидат и пароль из БД. Вернет true или false
    return next(new AppError('Incorrect email or password', 401)); //401 - unauthorized //лучше не говорить что конкретно не верно, чтобы не давать злоумышленникам лишнюю информацию
  }

  //3) Если все ок - отправить JWT клиенту
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Получение токена и проверка его
  let token;
  if (
    req.headers.authorization && //если есть хедер авторизация И
    req.headers.authorization.startsWith('Bearer') //строка его значения начинается с Bearer
  ) {
    token = req.headers.authorization.split(' ')[1]; //вытягиваем токен: разделяем строку по пробелу и берем второй элемент полученного массива
  }
  //console.log(token);

  if (!token) {
    return next(
      //если нет токена - выйти из функции и перейти в глобал эррор хэндлер
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  //2) Верификация токена
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //promisify вернет промис// в результате значением промиса будут декодированные данные (decoded payload from JWT) and save to decoded //передаем токен и для создания тестовой подписи нужно передать секрет
  //console.log(decoded);

  //3) Проверить существует ли еще пользователь
  //Если мы дошли до этой стадии - верификация была успешна до этой стадии и мы уверены что пользователь верный, теперь нужно проверить существует ли он еще в БД
  const currentUser = await User.findById(decoded.id); //ищем пользователя по айди, полученному в результате декодирования токена
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token are no longer exist.', 401)
    );
  }

  //4) Проверить менял ли пользователь пароль после выписки JWT
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  } //iat - issued at, когда выписан токен

  req.user = currentUser; //присваиваем данные
  next(); //В случае если все проверки выше успешны - next() вызовется и даст доступ к защищенным роутам
});
