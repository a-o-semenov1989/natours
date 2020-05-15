module.exports = (err, req, res, next) => {
  //console.log(err.stack) // увидеть error stack trace - покажет где случился error
  err.statusCode = err.statusCode || 500; //в случае если он определен, то он равен err.statusCode, в другом случае - 500 - internal server error
  err.status = err.status || 'error'; //при 500 - error, 400 - fail

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
}; //4 аргумента - express узнает что это error handling middleware - вызовется только в случае ошибки
