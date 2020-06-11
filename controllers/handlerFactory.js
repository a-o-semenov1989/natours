const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //передаем модель, возвращает асинхронную функцию
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      //если нету doc, он null - создаем еррор и через next(если в некст передан аргумент - это еррор) отправляем в глобальный эррор хэндлер
      return next(new AppError('No document found with that ID', 404)); //return чтобы вернуться из функции и не дойти до res
    }

    res.status(204).json({
      //204 - нет контента
      status: 'success',
      data: null, //после удаления данные не отправляются, показываем что удаленный ресурс больше не существует
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      //первым аргументом в чем заменить, вторым - что, третий - опции
      new: true, // обновлненный документ вернется, а не оригинальный
      runValidators: true, //запустить проверку
    });

    if (!doc) {
      //если нету doc, он null - создаем еррор и через next(если в некст передан аргумент - это еррор) отправляем в глобальный эррор хэндлер
      return next(new AppError('No document found with that ID', 404)); //return чтобы вернуться из функции и не дойти до res
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //оборачиваем в функцию catchAsync(createTour)
    const doc = await Model.create(req.body); //применяем метод create на модель документа напрямую и в эту функцию передаем данные из пост запроса // Model.create() //все поля которых нет в схеме проигнорируются, поэтому безопасно напрямую из body

    res.status(201).json({
      //отправляем клиенту json со статусом 201 и данными
      status: 'success',
      data: {
        data: doc,
      },
    }); //201 статус - создан новыи ресурс на сервере //catch вынесен в catchAsync
  }); //всегда нужно отправить обратно что-нибудь чтобы завершить цикл запрос/ответ

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id); //сохраняем query в переменную //используем метод findById, id берем из роута req.params.id // Tour.findOne({ _id: req.params.id})
    if (popOptions) query = query.populate(popOptions); //если есть popOptions - используем метод populate(popOptions) и передаем в него опцию //populate чтобы показало рецензии к этому туру, virtual populate, reviews - имя поля которое мы хотим заполнить
    const doc = await query; //когда query окончательно готов - мы его await и сохраняем в переменную

    if (!doc) {
      //если нету тура, он null - создаем еррор и через next(если в некст передан аргумент - это еррор) отправляем в глобальный эррор хэндлер
      return next(new AppError('No document found with that ID', 404)); //return чтобы вернуться из функции и не дойти до res
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow nested getReviews on tour
    let filter = {}; //создаем пустой фильтр объект
    if (req.params.tourId) filter = { tour: req.params.tourId }; //если есть айди тура в запросе - записывааем в фильтр объект

    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query) //filter для nested getReviews on tour - если указан айди будет поиск только по айди тура, если нету - все рецензии
      .filter()
      .sort()
      .limitFields()
      .paginate(); //будут все методы из класса APIFeatures //передаем ему query - Tour.find() //передаем ему queryString - req.query //создаем цепочку из query
    const doc = await features.query; //query хранится в свойстве query //метод explain - вызовется после query
    //const doc = await features.query.explain(); //query хранится в свойстве query //метод explain - вызовется после query и покажет много информации о выполнении

    //SEND RESPONSE
    res.status(200).json({
      //в методе статус мы определяем код ответа //в методе send можно написать ответ //методом json можно отправить json и автоматически ставится content-type application/json
      //указываем статус, и используем спецификацию jsend для отправки json
      status: 'success',
      results: doc.length, // в случае отправки массива, не часть спец. jsend, клиенту будет видно количество туров
      data: {
        data: doc,
      },
    });
  });
