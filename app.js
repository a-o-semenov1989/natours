const express = require('express'); //ипмортируем экспресс
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express(); //к переменнои app добавятся методы из экспресс

//MIDDLEWARES //применяются ко всем routes
//console.log(process.env.NODE_ENV); //production или development
if (process.env.NODE_ENV === 'development') {
  //только в случае запуска приложения в режиме разработки
  app.use(morgan('dev')); //передаем аргумент, который определит как будет выглядеть логирование
}

app.use(express.json()); //middleware. данные из body парсятся из json и добавляются к объекту запроса //app.use чтобы использовать middleware express.json() //без него получили бы undefined
app.use(express.static(`${__dirname}/public`)); //в браузере можно открыть 127.0.0.1:3000/overview.html и другие статичные фаилы, public - не указывается и он корневои

app.use((req, res, next) => {
  //без указания route этот middleware будет применен ко всем запросам //middleware определяются до route handlers в коде
  //middleware, все имеют доступ к запросу и ответу, а также передается next (можно назвать по-другому) - тогда express будет знать что это middleware
  //console.log(req.headers); //показать хедер запроса
  req.requestTime = new Date().toISOString(); //ко всем реквестам добавится время //new Date = сейчас, toISOString сделает читабельную строку
  next(); //если не использовать next в middleware - не будет завершен цикл запрос/ответ и ответ не будет отправлен клиенту
});

//2)  ROUTES //middleware которые мы хотим применить к определенным routes
app.use('/api/v1/tours', tourRouter); //mounting router //toursRouter это middleware / //api/v1/tours - parent route //используем router только после их объявления
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  //all - все http методы //* - все url (которые не обработаны вышестояющими хэндлерами) //если мы дошли до этои точки, то это значит что цикл запрос-ответ не был завершен //если поставить выше в нашем коде то на все запросы будет этот ответ
  next(new AppError(`Can't find ${req.originalUrl} on this server!`), 404); //первыи аргумент - message, 2 - statusCode
  //next(err); //если функция next() получает аргумент - экспресс автоматически будет знать что случился эррор и то что мы передаем в next - error. И пропустит все следующие middlewares в стэке и переидет сразу в наш global error handling middleware, которыи затем будет выполнен
});

app.use(globalErrorHandler);

module.exports = app;
