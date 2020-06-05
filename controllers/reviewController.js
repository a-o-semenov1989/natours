const Review = require('../models/reviewModel');
//const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourAndUserIds = (req, res, next) => {
  //Allow nested routes
  //Пользователь может указать тур и айди пользователя вручную, когда их нет код ниже:
  if (!req.body.tour) req.body.tour = req.params.tourId; //если мы не указали тур в теле запроса - мы должны определить его как тот что указан в URL
  if (!req.body.user) req.body.user = req.user.id; //если не указан пользователь в теле запроса - мы должны определить его как тот что что мы получили из protect middleware
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
