const express = require('express');
const tourController = require('./../controllers/tourController'); //импортируем объект, своиствами которого являются функции

const router = express.Router();

router.param('id', tourController.checkID); //указываем 1 аргументом параметр, которыи мы ищем и для которого этот middleware запустится и 2 - middleware функцию (в неи три аргумента - req, res, next и 4-и значение параметра)

router
  .route('/') //это рут URL /api/v1/tours поэтому просто /
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour); //сначала 1 middleware, затем 2

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
