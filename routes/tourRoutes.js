const express = require('express');
const tourController = require('../controllers/tourController'); //импортируем объект, своиствами которого являются функции
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

/* //так код дублируется с reviewRoutes
router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );
*/
// POST /tours/id232343/reviews
// GET /tours/id232343/reviews
router.use('/:tourId/reviews', reviewRouter); //nested route //router - middleware, поэтому можем использовать use() на нем //использовать reviewRouter в случае если встретится путь как этот //будет перенаправлен в reviewRouter

router
  .route('/top-5-cheap') //когда пользователь пройдет по этому роуту
  .get(tourController.aliasTopTours, tourController.getAllTours); //сначала запустится middleware aliasTopTours и эта функция выставит все нужные для показа топ 5 туров свойства в query object, затем все туры с нужными query getAllTours

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(
  authController.protect, //сначала протект вызывается - проверяем аутентификацию
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan
);

router.route('/tours-within');

router
  .route('/') //это рут URL /api/v1/tours поэтому просто /
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect, //сначала протект вызывается - проверяем аутентификацию
    authController.restrictTo('admin', 'lead-guide'), //передаем в функцию-обертку роли которые имеют доступ //функция вернет middleware, которои будут доступны роли по замыканию
    tourController.deleteTour
  ); //1 middleware в стэке - протект, мы должны проверить залогинен ли пользователь, 2 - функция restrictTo(), в нее передаем роль пользователя. нужно определить его полномочия, 3 - выполнение операции

module.exports = router;
