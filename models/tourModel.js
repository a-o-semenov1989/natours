const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  //создаем новую мангуст схему
  name: {
    //указываем какие мы ожидаем данные и их тип, а также опции схемы
    type: String, //тип данных
    required: [true, 'A tour must have a name'], //валидатор, необходимое поле, первым аргументом true, вотрым сообщение об ошибке
    unique: true, //имя должно быть уникальным
    trim: true, //обрезает пробелы в начале и в конце
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5, //по-умолчанию, если мы не указываем значение, то реитинг будет 4.5
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false, //не будет показываться клиенту
  },
  startDates: [Date],
});

const Tour = mongoose.model('Tour', tourSchema); //создаем модель, передается нужное имя и схема

module.exports = Tour;
