const crypto = require('crypto');
const { promisify } = require('util'); //встроенный модуль импортируем промисификацию
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync'); //чтобы не писать try-catch block используем catchAsync
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); //создаем токен. 1 аргумент - Payload, у нас id - { id: id }. 2 аргумент строка - секрет (в config.env - должен быть 32 или больше символов)// 3 token header создатся автоматически, но передадим опции 3 аргументом через сколько токен будет просрочен
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    //делаем переменную с опциями для куки
    expires: new Date( //expires - через какое время браузер удалит куки
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), //нынешняя дата + 90 дней в милисекундах (90 * 24 часа * 60 минут * 60 секунд *1000 милисекунд)
    httpOnly: true, //куки не могут быть доступны или модифицированы браузером. Браузер может только получить куки, хранить и затем автоматически вместе с каждым запросом
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //Включить только в продакшн режиме secure - куки будут отправлены только по защищенному соединению HTTPS

  res.cookie('jwt', token, cookieOptions); //отправляем куки клиенту, 1 - имя, 2 - данные (у нас токен), 3 - опции

  user.password = undefined; //уберем пароль из ответа

  res.status(statusCode).json({
    status: 'success',
    token, //отправляем токен клиенту
    data: {
      user, //user: user
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: req.body.photo,
  }); //данные получаем из req.body и создаем нового пользователя по нашей модели, которая базируется на схеме //нельзя просто req.body, нужно указывать какие именно поля, которые мы позволяем и которые нужно положить в нового пользователя, так пользователь не сможет зарегистрироваться как админ, поскольку поле с ролью не пойдет в newUser
  createSendToken(newUser, 201, res); //201 - успех. отправляем данные клиенту
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
  createSendToken(user, 200, res);
});

//Поскольку используется httpOnly cookie, мы не можем удалить его в браузере напрямую, отправим куки с таким же именем, но без токена и с коротким сроком годности
exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  }); //куки с таким же именем перезапишет куки с jwt, вместо jwt у нас dummy текст и опции - 10 сек срок давности и httpOnly
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1) Получение токена и проверка его
  let token;
  if (
    req.headers.authorization && //если есть хедер авторизация И
    req.headers.authorization.startsWith('Bearer') //строка его значения начинается с Bearer
  ) {
    token = req.headers.authorization.split(' ')[1]; //вытягиваем токен: разделяем строку по пробелу и берем второй элемент полученного массива
  } else if (req.cookies.jwt) {
    //если не было токена в authorization header, тогда обратить внимание на куки
    token = req.cookies.jwt; //если есть куки - присвоить токену jwt из куки
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

  req.user = currentUser; //присваиваем данные и сохраняем для передачи в следующии middleware
  res.locals.user = currentUser; //помещаем пользователя в res.locals и передаем локал в pug template
  next(); //В случае если все проверки выше успешны - next() вызовется и даст доступ к защищенным роутам
});

//Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) Верификация токена
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      ); //promisify вернет промис// в результате значением промиса будут декодированные данные (decoded payload from JWT) and save to decoded //передаем токен и для создания тестовой подписи нужно передать секрет
      //console.log(decoded);

      //2) Проверить существует ли еще пользователь
      //Если мы дошли до этой стадии - верификация была успешна до этой стадии и мы уверены что пользователь верный, теперь нужно проверить существует ли он еще в БД
      const currentUser = await User.findById(decoded.id); //ищем пользователя по айди, полученному в результате декодирования токена
      if (!currentUser) {
        return next();
      }

      //3) Проверить менял ли пользователь пароль после выписки JWT
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      } //iat - issued at, когда выписан токен

      //ЕСТЬ ЗАЛОГИНЕННЫЙ ПОЛЬЗОВАТЕЛЬ
      res.locals.user = currentUser; //помещаем пользователя в res.locals и передаем локал в pug template
      return next(); //В случае если все проверки выше успешны - next()
    } catch (err) {
      return next(); //если есть ошибки - перейти к следующей middleware
    }
  }
  next(); //если нету куки - next(), нету залогиненного пользователя, запустить следующую middleware
};

exports.restrictTo = (...roles) => {
  //создаст массив аргументов, которые мы указываем //оборачиваем в функцию чтобы передать аргументы в middleware, напрямую нельзя
  return (req, res, next) => {
    //возвращаем новую функцию - сама middleware функция //получит доступ к параметру (массиву ['admin', 'lead-guide']) roles по замыканию.
    if (!roles.includes(req.user.role)) {
      //Если роль пользователя не содержится в этом массиве, например 'user', - не получит доступ. includes() - array method //роль пользователя содержится в req.user - полученном из предыдущего middleware protect
      return next(
        new AppError('You do not have permission to perform this action', 403)
      ); //403 - forbidden
    }

    next(); //если все ок - next
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Получить пользователя основываясь на POSTed email
  const user = await User.findOne({ email: req.body.email }); //не по id потому что id не известен
  if (!user) {
    return next(new AppError('There is no user with this email address.', 404));
  }
  //2) Сгенерировать случаиныи reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //сохраняем //валидаторы не будут проверять перед сохранением, поскольку мы не можем указать пароль - валидацию мы не смогли бы проити

  //3) Отправить пользователю по email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`; //сначала протокол http или https, берем из запроса, //хост //url // token

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    //нужен try catch блок, поскольку мы не просто отправляем эррор клиенту
    await sendEmail({
      //вернет промис
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!', //токен отправляем на имеил, а не json-ом
    });
  } catch (err) {
    user.passwordResetToken = undefined; //убираем токен из БД
    user.passwordResetExpires = undefined; //убираем
    await user.save({ validateBeforeSave: false }); //сохраняем в БД изменения

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500 //500 - ошибка на сервере
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Получить пользователя основываясь на токене
  //Хешируем токен чтобы сравнить с токеном хранящимся в БД в хешированном виде
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); //req.params.token - в парамс, поскольку мы указываем его в URL '/resetPassword/:token'

  const user = await User.findOne({
    passwordResetToken: hashedToken, // ищем в БД по хешированному токену
    passwordResetExpires: { $gt: Date.now() }, //проверяем чтобы токен не был просрочен
  });

  //2) Если токен не просрочен и есть пользователь - установить новыи пароль
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //валидторы оставляем включенными, чтобы проверить соответствие пароля и повторного пароля

  //3) Обновить значение changedPasswordAt своиства для пользователя
  //в userModel
  //4) Log the user in, отправить JWT клиенту
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Получить пользователя из коллекции
  const user = await User.findById(req.user.id).select('+password'); //req.user.id - получено из middleware protect, клиент уже залогинен на данном этапе. //поле password изначально убрано для показа, чтобы получить его в output делаем select('+password')

  //2) Проверить правилен ли переданныи POST запросом текущий пароль
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3) Если он правилен - обновить пароль
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) Log in user, отправить JWT //Чтобы пользователь остался залогиненным после смены пароля
  createSendToken(user, 200, res);
});
