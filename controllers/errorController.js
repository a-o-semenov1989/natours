const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  //передаем err
  const message = `Invalid ${err.path}: ${err.value}.`; //используем данные из err
  return new AppError(message, 400); //возвращаем новый эррор созданный по классу, и передаем сообщение и код ошибки
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; //вытаскиваем регуляркой из строки errmsg (свойство в err) текст между кавычками, который является названием //нам нужен первый элемент полученного таким образом списка
  //console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message); //Object.values - объекты ошибки (объекты errors в объекте error), их значение. Чтобы получить их message нужно указать values.message проходим циклом по объекту и все свойства собираем в строки. На каждой итерации возвращаем сообщение

  const message = `Invalid input data. ${errors.join('. ')}`; //join собираем сообщения в одну строку, используя как разделитель между сообщениями точку и строку
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token! Plesase log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  //передаем err, req и res, res чтобы отправить ответ
  //1) API
  if (req.originalUrl.startsWith('/api')) {
    //originalUrl - это url целиком, но без хоста - выглядит как роут. Когда url начинается с api - отправить эррор в виде json
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //2) RENDERED WEBSITE
  //если не начинается с АПИ - рендерим эррор
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  //I) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      //A) только в случае если это операционный эррор (которому мы доверяем) мы отправим клиенту сообщение
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //B) програмный или другой тип эррора - отправляем стандартный еррор с 500 и не сообщаем клиенту деталей ошибки
    //1) лог в консоль
    console.error('ERROR', err);
    //2) Отправляем стандартное сообщение без деталей клиенту
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  //II) RENDERED WEBSITE
  //A) только в случае если это операционный эррор (которому мы доверяем) мы отправим клиенту сообщение
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  //B) програмный или другой тип эррора - отправляем стандартный еррор с 500 и не сообщаем клиенту деталей ошибки
  //1) лог в консоль
  console.error('ERROR', err);
  //2) Отправляем стандартное сообщение без деталей клиенту
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack) // увидеть error stack trace - покажет где случился error
  err.statusCode = err.statusCode || 500; //в случае если он определен, то он равен err.statusCode, в другом случае - 500 - internal server error
  err.status = err.status || 'error'; //при 500 - error, 400 - fail

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res); //вызываем функцию sendErrorDev с эррором и ответом
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; //создаем хард копию, используя децентрализацию, и используем ее ниже
    error.message = err.message; //чтобы в копии корректно скопировалось сообщение об ошибке из оригинального эррора

    if (error.name === 'CastError') error = handleCastErrorDB(error); //передаем эррор в случае CastError (увидели name в err в консоли или postman), - вернет новый эррор, созданный с нашего класса AppError, с отметкой операционного error, сохраняем в error
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); //код ошибки MongoDB одинаковое имя, валидатор unique (увидели code в err в консоли или postman)
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
}; //4 аргумента - express узнает что это error handling middleware - вызовется только в случае ошибки
