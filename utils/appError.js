class AppError extends Error {
  //используем в дальнеишем для создания operational errors
  constructor(message, statusCode) {
    super(message); //только message, потому что это единственныи параметр, принимаемыи встроенным еррор //parent call, Все что мы передали сюда будет своиством сообщением

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; //статус зависит от statusCode, чтобы его узнать - конвертируем в строку. startsWith() встроенная функция в JS для строк, которая определяет с чего начинается строка. Если с 4 - фэил, в другом случае (например с 5) - эррор
    this.isOperational = true; //ставим флажок true на своиство isOperational

    Error.captureStackTrace(this, this.constructor); //так созданныи с помощью конструктора еррор не появится в stack trace
  }
}

module.exports = AppError;
