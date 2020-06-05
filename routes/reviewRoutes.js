const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); //определяем опции:  //по умолчанию роутеры имеют доступ к параметрам их определенных роутов

//Protect all routes after this middleware
router.use(authController.protect);

// POST /tours/id232343/reviews
// GET /tours/id232343/reviews
// POST /reviews
router
  .route('/') //здесь tourId нету, но он есть в tourRoutes - router.use('/:tourId/reviews', reviewRouter); //чтобы получить доступ используем mergeParams //nested route
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
