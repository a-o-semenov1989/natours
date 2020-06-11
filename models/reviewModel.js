const mongoose = require('mongoose');
const Tour = require('./tourModel');

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

//Пользователь может оставить только один отзыв к каждому туру
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //создаем compound index, опцией передаем unique: true - комбинация пользователя и тура для отзыва всегда должны быть уникальны

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

//Static method. В статитчных методах this указывает на Модель. Вызываются на Модель
//Создали как статичный метод, поскольку нам нужно вызвать aggregate функцию на модели. Этот статичный метод считает среднюю оценку отзывов и количество отзывов по заданному по айди туру для которого был создан отзыв
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //tour = tour id тура, к которому относятся review
  //console.log(tourId);
  const stats = await this.aggregate([
    //this - текущая модель //aggregate всегда на Модель
    {
      //1 стадия - выбрать все review, относящихся к данному туру
      $match: { tour: tourId }, //tour: tour
    },
    {
      //2 стадия - group stage - подстчет статистики
      $group: {
        _id: '$tour', //группируем review по туру
        nRating: { $sum: 1 }, //добавляем по 1 за каждую рецензию к туру, который matched на предыдущем шаге
        avgRating: { $avg: '$rating' }, //подсчет среднего значения поля rating
      },
    },
  ]);
  //console.log(stats); //покажет массив со сгруппированной статистикой
  //3) сохраняем полученные данные в коллекцию туров
  if (stats.length > 0) {
    //если длина массива stats > 0 значит есть отзывы
    await Tour.findByIdAndUpdate(tourId, {
      //находим тур по переданному айди и обновляем, передаем объект с обновленными данными
      ratingsQuantity: stats[0].nRating, //1 элемент массива stats и nRating
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    //отзывов нету
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0, //отзывов нету
      ratingsAverage: 4.5, //значение по-умолчанию
    });
  }
};

//Для подсчета статистики после создания отзыва
reviewSchema.post('save', function () {
  //post потому что при pre review еще не в коллекции. Пост подходит чтобы провести рассчеты по всем отзывам в коллекции и затем сохранить результат в туре
  //В пост нет доступа к некст и он не вызывается
  this.constructor.calcAverageRatings(this.tour); //this.constructor - здесь все еще указывает на модель, конструктор - модель, создавшая документ. Статические методы вызываются на модели, но мы не можем напрямую вызвать на Review, поскольку на этом этапе Review еще объявлен, а если разместить middleware ниже его декларации - Review не будет его содержать
  //в скобках - this - document который будет сохранен, current review //tour - tour ID, который мы передадим в calcAverageRatings
});

//Для пересчета статистики после удаления или обновления отзыва. Нету подходящей document middleware, поэтому используем query middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //регулярка - все начиная с findOneAnd (сокращение для findById - за кулисами)
  this.r = await this.findOne(); //this здесь укажет на query //query middleware, доступ только к query, поэтому чтобы получить доступ к документу (как в document middleware) мы выполняем query, используя findOne и получая нужный документ из БД и сохраняем в current query variable//Не получится использовать пост, поскольку query уже будет выполнен //сохраняем r (review) в виде this.r создавая таким образом свойство, чтобы передать данные из pre middleware в post
  //console.log(this.r);
  next();
});
//query выполнен, review обновлен, теперь можно использовать calcAverageRatings
reviewSchema.post(/^findOneAnd/, async function () {
  //await this.findOne(); здесь не сработает, поскольку query выполнен
  await this.r.constructor.calcAverageRatings(this.r.tour); //this.r здесь эквивалентен this в this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
