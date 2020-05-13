const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator'); //библиотека с валидаторами и санитаизерами

const tourSchema = new mongoose.Schema(
  {
    //создаем новую мангуст схему
    name: {
      //указываем какие мы ожидаем данные и их тип, а также опции схемы
      type: String, //тип данных
      required: [true, 'A tour must have a name'], //валидатор, необходимое поле, первым аргументом true, вотрым сообщение об ошибке
      unique: true, //имя должно быть уникальным
      trim: true, //обрезает пробелы в начале и в конце
      maxlength: [40, 'A tour name must have less or equal then 40 characters'], //валидатор для строк. 1 аргумент - макс. длина, 2 - сообещние при ошибке
      minlength: [5, 'A tour name must have more or equal then 5 characters'], //валидатор для строк. 1 аргумент - мин. длина, 2 - сообещние при ошибке
      //validate: [validator.isAlpha, 'Tour name must only contain characters'], //validator из библиотеки: объект, его функции - методы (своиства)// Не использовать в данном случае, поскольку с пробелами между словами имя не пропустит
    },
    slug: String,
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
      enum: {
        values: ['easy', 'medium', 'difficult'], //валидатор для строк, принимает массив с допустимымыми полями
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, //по-умолчанию, если мы не указываем значение, то реитинг будет 4.5
      min: [1, 'Rating must be above 1.0'], //валидатор для чисел и дат
      max: [5, 'Rating must be below 5.0'], //валидатор для чисел и дат
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //кастомныи валидатор, принимает функцию
        validator: function (val) {
          return val < this.price; //возвращает true or false //this - указывает на текущии документ, когда мы создаем новыи документ. Не будет работать с update
        },
        message: 'Discount price ({VALUE}) should be below regular price', //у сообщения есть доступ к val в mongoose, val = ({VALUE})
      },
    },
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
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true }, //когда output в виде JSON - включить виртуальные своиства, они будут частью ответа
    toObject: { virtuals: true },
  }
); //1 объект - schema definiton, 2 - options

tourSchema.virtual('durationWeeks').get(function () {
  //virtual property - создается каждыи раз когда мы получаем данные из БД
  return this.duration / 7; //не стрелка, чтобы было this
});

//DOCUMENT MIDDLEWARE - pre запустится до команд .save() and .create(), но не на update(), и например insertMany(). Можно повлиять на документ до того как он сохранится в БД. post() - после созранения документа в БД
//pre save hook
tourSchema.pre('save', function (next) {
  //у всех middleware есть доступ к next
  this.slug = slugify(this.name, { lower: true }); //this указывает на processed document //console.log(this)
  next(); //вызывает следующи middleware
}); //pre - pre middleware, запустится до ивента, в данном случае - save

/*
tourSchema.pre('save', function (next) {
  //может быть несколько пре или пост хуков
  console.log('Will save document...');
});

tourSchema.post('save', function (doc, next) {
  //в пост доступ не только к next, но и к только что сохраненному в БД документе. Выполняются после всех пре функции
  console.log(doc); //документ сохраненныи в БД
  next();
});
*/

//QUERY MIDDLEWARE
//tourSchema.pre('find', function (next) { //сработает только для find
tourSchema.pre(/^find/, function (next) {
  //отработает перед поиском и не выдаст в ответе секретные туры
  //find hook значит что это query middleware //благодаря регулярному выражению будет работать с findOne и с find и с т.п. командами - все что начинается с find
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next(); //this теперь указывает на query, а не на документ
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  //console.log(docs); //все полученные в ответе документы
  next();
});

//AGGREGATION MIDDLEWARES
tourSchema.pre('aggregate', function (next) {
  //aggregate hook
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //unshift() - добавить в начало списка// добавить все которые не секретны

  console.log(this); //this указывает на текущии aggregation object //console.log(this.pipeline()) - pipeline object
  next();
});

const Tour = mongoose.model('Tour', tourSchema); //создаем модель, передается нужное имя и схема

module.exports = Tour;