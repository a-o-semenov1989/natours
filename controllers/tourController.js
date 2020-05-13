const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = async (req, res, next) => {
  //функция выставит все нужные для показа топ 5 туров свойства в query object до срабатывания getAllTours
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); //будут все методы из класса APIFeatures //передаем ему query - Tour.find() //передаем ему queryString - req.query //создаем цепочку из query
    const tours = await features.query; //query хранится в свойстве query

    //SEND RESPONSE
    res.status(200).json({
      //в методе статус мы определяем код ответа //в методе send можно написать ответ //методом json можно отправить json и автоматически ставится content-type application/json
      //указываем статус, и используем спецификацию jsend для отправки json
      status: 'success',
      results: tours.length, // в случае отправки массива, не часть спец. jsend, клиенту будет видно количество туров
      data: {
        tours, //tours: tours(результат const tours)
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id); //используем метод findById, id берем из роута req.params.id // Tour.findOne({ _id: req.params.id})
    //Tour.findOne({ _id: req.params.id }); //behind the scenes
    res.status(200).json({
      status: 'success',
      data: {
        tour, //tours: tour
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    //const newTour = new Tour({}); //newTour создается по модели Tour и у него есть доступ к методам, поскольку это часть прототипа объектов этого класса
    //newTour.save() // Model.prototype.save() //применяем метод сэйв к документу newTour созданному по модели Tour, а не к модели
    const newTour = await Tour.create(req.body); //применяем метод create на модель тура напрямую и в эту функцию передаем данные из пост запроса // Model.create()
    res.status(201).json({
      //отправляем клиенту json со статусом 201 и данными
      status: 'success',
      data: {
        tour: newTour,
      },
    }); //201 статус - создан новыи ресурс на сервере
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    }); //400 - bad request
  }
}; //всегда нужно отправить обратно что-нибудь чтобы завершить цикл запрос/ответ

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      //первым аргументом в чем заменить, вторым - что, третий - опции
      new: true, // обновлненный документ вернется, а не оригинальный
      runValidators: true, //запустить проверку
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      //204 - нет контента
      status: 'success',
      data: null, //после удаления данные не отправляются, показываем что удаленный ресурс больше не существует
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

//aggregation pipeline
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }, //stage match - все что соответствует этому
      },
      {
        $group: {
          //stage group - группируем документы
          _id: { $toUpper: '$difficulty' }, //_id: null, - все документы // _id: '$difficulty', - сгруппирует туры по сложности //_id: '$ratingsAverage', - по рейтингу //$toUpper - в ответе будет заглавными буквами
          numTours: { $sum: 1 }, //для каждого документа в пайплайне будет 1, таким образом посчитается количество документов
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' }, //задаем новое поле, в нем считаем среднее значение определенного поля
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 }, //сортируем, нужно указывать имена из предыдущей стадии //1 - по возрастанию, -1 - по убыванию
      },
      //{
      //  $match: { _id: { $ne: 'EASY' } }, //стадии могут повторяться, _id у нас - $difficulty. уберет туры со сложностью easy
      //},
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1; //так получим из строки число //2021 Год

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates', //deconstruct array field of input documents and then output 1 document for each element of array
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), //промежуток между первым днем года и последним
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' }, //берем месяц из дат
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' }, //создаем массив и пушим в него имена туров
        },
      },
      {
        $addFields: { month: '$_id' }, // создает поле с именем month со значением из _id (в нашем случае - месяц)
      },
      {
        $project: {
          _id: 0, //если в project - 0, значит не будет отображаться, 1 - будет
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 10, //покажет только 10 результатов
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};