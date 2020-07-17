const multer = require('multer'); //for user photo upload
const sharp = require('sharp'); //image processing library
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage(); //сохраняем в память. доступно из буфера - req.file.buffer

const multerFilter = (req, file, cb) => {
  //Определяет является ли загружаемый файл изображением, если файл это изображение - true, если нет - false с эррором. Можно не только для изображения (в других случаях и проэктах)
  if (file.mimetype.startsWith('image')) {
    //если начинается с image (независимо от расширения - все изображения)
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}); //передаем объект с опциями - назначение и фильтр //можно без опций и без папки назначения - тогда загруженные изображения будут хранится в памяти, а не сохранятся на диск

exports.uploadTourImages = upload.fields([
  //передаем массив с объектами, в которых указано имя поля и сколько полеи может быть
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]); //fields - когда есть например одно поле и несколько полеи с одиноковым именем
//upload.single('image') //когда одно поле с фаилом //console.log(req.file); //один фаил
//upload.array('images', maxCount: 5) //когда несколько полеи с одиноковым именем

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files); //files когда несколько файлов

  if (!req.files.imageCover || !req.files.images) return next(); //если нет обложки или изображении - переити к следующеи middleware

  // 1) Cover image
  //в случае обработки файла перед сохранением - лучше сначала сохранить его в памяти, а потом на диск
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; //имя - аиди берем из парамс роута (он всегда его будет содержать) + отпечаток времени + слово cover чтобы обозначить обложку тура //updateTour обновит все что будет в req.body, поэтому сохраняем значения поля в нем. imageCover потому что так в схеме называется поле
  await sharp(req.files.imageCover[0].buffer) //получаем загруженный файл (это массив, 1 его элемент) из буффера
    .resize(2000, 1333) //меняем его размер на пропорцию 2/3
    .toFormat('jpeg') //меняем формат на jpeg
    .jpeg({ quality: 90 }) //качество 90% от исходного
    .toFile(`public/img/tours/${req.body.imageCover}`); //сохраняем итоговый файл на диск

  // 2) Images
  req.body.images = []; //создаем пустои массив
  await Promise.all(
    //используя мап мы получим массив промисов - и если их не подождать все, в массив изображении в документе не запушатся элементы
    req.files.images.map(async (file, i) => {
      //проходимся циклом по массиву изображении, передаем фаил и индекс
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`; //имя - индекс + 1 (он с 0)

      await sharp(file.buffer) //получаем загруженный файл на каждои итерации из буффера
        .resize(2000, 1333) //меняем его размер на пропорцию 2/3
        .toFormat('jpeg') //меняем формат на jpeg
        .jpeg({ quality: 90 }) //качество 90% от исходного
        .toFile(`public/img/tours/${filename}`); //сохраняем итоговый файл на диск

      //filename нужен поскольку пушим его в req.body.images (в коллекции он массив)
      req.body.images.push(filename); //на каждои итерации пушим элемент в массив
    })
  );

  //console.log(req.body);
  next();
});

exports.aliasTopTours = async (req, res, next) => {
  //функция выставит все нужные для показа топ 5 туров свойства в query object до срабатывания getAllTours
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

/*
exports.getAllTours = catchAsync(async (req, res, next) => {
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
});
*/
exports.getAllTours = factory.getAll(Tour);

/*
exports.getTour = catchAsync(async (req, res, next) => {
  //используем метод findById, id берем из роута req.params.id // Tour.findOne({ _id: req.params.id})
  const tour = await Tour.findById(req.params.id).populate('reviews'); //populate чтобы показало рецензии к этому туру, virtual populate, reviews - имя поля которое мы хотим заполнить
  //Tour.findOne({ _id: req.params.id }); //behind the scenes

  if (!tour) {
    //если нету тура, он null - создаем еррор и через next(если в некст передан аргумент - это еррор) отправляем в глобальный эррор хэндлер
    return next(new AppError('No tour found with that ID', 404)); //return чтобы вернуться из функции и не дойти до res
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour, //tours: tour
    },
  });
});
*/
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); //передаем модель и popOptios - к какому полю применить populate //сюда же можно select, чтобы определить какие поля показать

/*
exports.createTour = catchAsync(async (req, res, next) => {
  //const newTour = new Tour({}); //newTour создается по модели Tour и у него есть доступ к методам, поскольку это часть прототипа объектов этого класса
  //newTour.save() // Model.prototype.save() //применяем метод сэйв к документу newTour созданному по модели Tour, а не к модели
  //оборачиваем в функцию catchAsync(createTour)
  const newTour = await Tour.create(req.body); //применяем метод create на модель тура напрямую и в эту функцию передаем данные из пост запроса // Model.create()

  res.status(201).json({
    //отправляем клиенту json со статусом 201 и данными
    status: 'success',
    data: {
      tour: newTour,
    },
  }); //201 статус - создан новыи ресурс на сервере //catch вынесен в catchAsync
}); //всегда нужно отправить обратно что-нибудь чтобы завершить цикл запрос/ответ
*/
exports.createTour = factory.createOne(Tour);

/*
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    //первым аргументом в чем заменить, вторым - что, третий - опции
    new: true, // обновлненный документ вернется, а не оригинальный
    runValidators: true, //запустить проверку
  });

  if (!tour) {
    //если нету тура, он null - создаем еррор и через next(если в некст передан аргумент - это еррор) отправляем в глобальный эррор хэндлер
    return next(new AppError('No tour found with that ID', 404)); //return чтобы вернуться из функции и не дойти до res
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
*/
exports.updateTour = factory.updateOne(Tour); //передаем модель //вернет другую функцию, которая будет ожидать вызова

/*
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    //если нету тура, он null - создаем еррор и через next(если в некст передан аргумент - это еррор) отправляем в глобальный эррор хэндлер
    return next(new AppError('No tour found with that ID', 404)); //return чтобы вернуться из функции и не дойти до res
  }

  res.status(204).json({
    //204 - нет контента
    status: 'success',
    data: null, //после удаления данные не отправляются, показываем что удаленный ресурс больше не существует
  });
});
*/
exports.deleteTour = factory.deleteOne(Tour); //передаем модель //вернет другую функцию, которая будет ожидать вызова

//aggregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
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
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
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
});

//To do geospatial queries we need to first attribute index to the field where geospatial data that we are searching for is stored (in our case - add index to startLocation)
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.1111745,-118.113491/unit/mi - в таком виде будет query
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; //получаем нужные параметры из params запроса при помощи деструктуризации
  const [lat, lng] = latlng.split(','); //разделяем координаты по запятой - получим список из 2 элементов и сохраняем в переменные

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //определяем радиус - расстояние которое нам нужно как радиус, конвертированное в unit - radians - для этого делим наше расстояние на радиус Земли //тернарный оператор - если в милях делим на 3963.2, если в км - делим на 6378,1

  if (!lat || !lng) {
    //если отсутствует одна из координат или обе
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  //console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    //startLocation - geospatial point //operator geoWithin - ищет документы внутри определенной геометрии
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  }); // Чтобы найти внутри определенного радиуса - определяем радиус при помощи $centerSphere - он принимает массив с координатами (тоже массив) и радиусом (receive radians)

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; //получаем нужные параметры из params запроса при помощи деструктуризации
  const [lat, lng] = latlng.split(','); //разделяем координаты по запятой - получим список из 2 элементов и сохраняем в переменные

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; //число на которое будут умножены все расстояния //если мили - переводим метры в мили, если км - переводим метры в км //* 0.001 - так поделится на 1000 и из метров получим километры

  if (!lat || !lng) {
    //если отсутствует одна из координат или обе
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        //в geospatial aggregation pipeline 1 стадия. Всегда должна быть первой в пайплайне. Нужно чтобы хотя бы одно из наших полей включало geospatial index, если только одно поле - автоматически будет использоваться для рассчетов
        //2 обязательных поля в geoNear:
        near: {
          //geoJSON, свойство - мы передаем его в lat lng - откуда рассчитывать дистанции. Все рассчеты будет между этой точкой, которую мы определяем тут и стартовыми локациями
          type: 'Point',
          coordinates: [lng * 1, lat * 1], //*1 - конвертируем в числа
        },
        distanceField: 'distance', //свойство которое будет создано и где все рассчеты расстояний будут хранится
        distanceMultiplier: multiplier, //число на которое будут умножены все расстояния
      },
    },
    {
      $project: {
        //следующая стадия, определяем какие поля показывать
        distance: 1, //1 - показывать
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
