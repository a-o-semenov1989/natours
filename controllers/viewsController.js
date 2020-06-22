const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find(); //найти все туры в коллекции
  // 2) Build template - в /views/overview.pug
  // 3) Render that template using tour data from step 1
  res.status(200).render('overview', {
    //рендерит темплейт с именем которое мы передаем, экспресс будет искать его в папке которую мы указали выше - views - app.set('views', path.join(__dirname, 'views'));
    title: 'All Tours', //передаем объект с данными //эти переменные называются locals в pug file
    tours, //tours: tours // передаем все туры
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    //ищем тур по слагу из URL и populate reviews, они автоматически не популэйт в отличии от гидов
    path: 'reviews',
    fields: 'review rating user', //поля которые нам нужны заполнеными для дальнейшей отрисовки
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  } //если нет тура с таким именем - эррор и 404

  // 2) Build template
  // 3) Render that template using data from step 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = (req, res, next) => {
  console.log('Updating user', req.body);
  //194 06-00
};
