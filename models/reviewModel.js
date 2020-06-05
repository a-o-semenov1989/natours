const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true }, //когда output в виде JSON - включить виртуальные своиства, они будут частью ответа
    toObject: { virtuals: true },
  }
); //1 объект - schema definiton, 2 - options

//QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  //this.populate({
  //  path: 'tour',
  //  select: 'name', //показать только имя
  //}).populate({
  //  path: 'user',
  //  select: 'name photo', //показать только имя и фото пользователя
  //});
  //убрал populate() tour в review
  this.populate({
    path: 'user',
    select: 'name photo', //показать только имя и фото пользователя
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
