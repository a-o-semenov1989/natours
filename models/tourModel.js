const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    //создаем новую мангуст схему
    name: {
      //указываем какие мы ожидаем данные и их тип, а также опции схемы
      type: String, //тип данных
      required: [true, 'A tour must have a name'], //валидатор, необходимое поле, первым аргументом true, вотрым сообщение об ошибке
      unique: true, //имя должно быть уникальным
      trim: true, //обрезает пробелы в начале и в конце
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

//Document middleware - pre запустится до команд .save() and .create(), но не на например insertMany(). Можно повлиять на документ до того как он сохранится в БД. post() - после созранения документа в БД
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

const Tour = mongoose.model('Tour', tourSchema); //создаем модель, передается нужное имя и схема

module.exports = Tour;
