const express = require('express');
const tourController = require('../controllers/tourController'); //импортируем объект, своиствами которого являются функции

const router = express.Router();

router
  .route('/top-5-cheap') //когда пользователь пройдет по этому роуту
  .get(tourController.aliasTopTours, tourController.getAllTours); //сначала запустится middleware aliasTopTours и эта функция выставит все нужные для показа топ 5 туров свойства в query object, затем все туры с нужными query getAllTours

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/') //это рут URL /api/v1/tours поэтому просто /
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
