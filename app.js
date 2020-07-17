const path = require('path'); //встроенный модуль для манипулирования путями
const express = require('express'); //ипмортируем экспресс
const morgan = require('morgan'); //Development logging
const rateLimit = require('express-rate-limit'); //библиотека для ограничения запросов с одного айпи
const helmet = require('helmet'); //Security HTTP headers
const mongoSanitize = require('express-mongo-sanitize'); //Data sanitization against NoSQL query injection
const xss = require('xss-clean'); //Data sanitization against XSS
const hpp = require('hpp'); //Prevent parameter pollution
const cookieParser = require('cookie-parser'); //parses the data from the cookie

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express(); //к переменнои app добавятся методы из экспресс

//Set up pug engine
app.set('view engine', 'pug'); //определяем template engine - pug //все происходит автоматичесчки, экспресс знает pug out of the box //pug templates = views
app.set('views', path.join(__dirname, 'views')); //создает path присоединя директорию где расположены views в нашей файловой архитектуре

//1) GLOBAL MIDDLEWARES //применяются ко всем routes
//Serving static files
app.use(express.static(path.join('public'))); //в браузере можно открыть 127.0.0.1:3000/overview.html и другие статичные фаилы, public - не указывается и он корневои //создает path присоединя директорию где расположен public

//Set security HTTP headers
app.use(helmet()); //надо располагать ближе к началу, а не к концу

//Development logging
//console.log(process.env.NODE_ENV); //production или development
if (process.env.NODE_ENV === 'development') {
  //только в случае запуска приложения в режиме разработки
  app.use(morgan('dev')); //передаем аргумент, который определит как будет выглядеть логирование
}

//Limit requests from same IP
const limiter = rateLimit({
  //функция из библиотеки для ограничения количества запросов с одного айпи, принимает объект с опциями
  max: 200, //количество попыток
  windowMs: 60 * 60 * 1000, //в час
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); //используем функцию лимитер только в отношении API

//Body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' })); //middleware. данные из body парсятся из json и добавляются к объекту запроса //app.use чтобы использовать middleware express.json() //без него получили бы undefined //передаем объект опцию, устанавливая ограничение в 10 кб
app.use(express.urlencoded({ extended: true, limit: '10kb' })); //parse data from url encoded form //extended: true позволяет передавать более сложные формы данных
//Cookie parser
app.use(cookieParser()); //parses the data from the cookies

//Data sanitization against NoSQL query injection
app.use(mongoSanitize()); //фильтрует и убирает спец символы ($ и т.д.)

//Data sanitization against XSS
app.use(xss()); //фильтрует внедряемый html код, конвертируя html символы

//Prevent parameter pollution
app.use(
  //clear up query string
  hpp({
    //передаем массив с допустимыми свойствами для которых мы разрешаем дублирующиеся параметры сортировки в query string
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Test middleware
app.use((req, res, next) => {
  //без указания route этот middleware будет применен ко всем запросам //middleware определяются до route handlers в коде
  //middleware, все имеют доступ к запросу и ответу, а также передается next (можно назвать по-другому) - тогда express будет знать что это middleware
  //console.log(req.headers); //показать хедер запроса
  req.requestTime = new Date().toISOString(); //ко всем реквестам добавится время //new Date = сейчас, toISOString сделает читабельную строку
  //console.log(req.cookies); //на каждом запросе показывает куки в консоли
  next(); //если не использовать next в middleware - не будет завершен цикл запрос/ответ и ответ не будет отправлен клиенту
});

//2)  ROUTES //middleware которые мы хотим применить к определенным routes
app.use('/', viewRouter); //mounted on root URL
app.use('/api/v1/tours', tourRouter); //mounting router //toursRouter это middleware / //api/v1/tours - parent route //используем router только после их объявления
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  //all - все http методы //* - все url (которые не обработаны вышестояющими хэндлерами) //если мы дошли до этои точки, то это значит что цикл запрос-ответ не был завершен //если поставить выше в нашем коде то на все запросы будет этот ответ
  next(new AppError(`Can't find ${req.originalUrl} on this server!`), 404); //первыи аргумент - message, 2 - statusCode
  //next(err); //если функция next() получает аргумент - экспресс автоматически будет знать что случился эррор и то что мы передаем в next - error. И пропустит все следующие middlewares в стэке и переидет сразу в наш global error handling middleware, которыи затем будет выполнен
});

app.use(globalErrorHandler);

module.exports = app;
