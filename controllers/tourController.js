const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
); //читаем нужныи фаил и парсим json в массив js объектов

exports.checkID = (req, res, next, val) => {
  //param middleware, val = id
  console.log(`Tour id is ${val}`); //val имеет значение id
  if (req.params.id * 1 > tours.length) {
    //если айди тура больше чем длина массива туров, выйти из функции и отправить ответ со статусом 404 и json с описанием
    return res.status(404).json({
      //return обязателен, чтобы выити из функции после отправки ответа и таким образом не вызвать next
      status: 'fail', //когда 400 - статус fail
      message: 'Invalid ID',
    });
  }
  next(); //в middleware обязательно вызывать next что завершить цикл запрос-ответ
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }
  next();
};

exports.getAllTours = (req, res) => {
  // в колбэк 2 аргумента - запрос и ответ
  console.log(req.requestTime);

  res.status(200).json({
    //в методе статус мы определяем код ответа //в методе send можно написать ответ //методом json можно отправить json и автоматически ставится content-type application/json
    //указываем статус, и используем спецификацию jsend для отправки json
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length, // в случае отправки массива, не часть спец. jsend, клиенту будет видно количество туров
    data: {
      tours, //tours: tours(результат const tours)
    },
  });
};

exports.getTour = (req, res) => {
  console.log(req.params); //тут хранятся все параметры всех переменных, которые мы определили
  const id = req.params.id * 1; //трюк, позволяющий айди сделать из строки цифрой. JS при умножении строки, похожей на цифру, на другую цифру, автоматически конвертирует в цифру

  const tour = tours.find((el) => el.id === id); //в find передаем колбэк, проходит циклом по массиву и ищет в массиве туров элемент с айди идентичным айди из запроса. создаст массив с подходящими объектами// если подходящего не будет tour = undefined

  res.status(200).json({
    status: 'success',
    data: {
      tour, //tours: tour
    },
  });
};

exports.createTour = (req, res) => {
  //console.log(req.body);
  const newId = tours[tours.length - 1].id + 1; //определяем новыи аиди: массив tours [длина массива - 1 даст нам последнии аиди] + 1
  const newTour = Object.assign({ id: newId }, req.body); //позволяет создать новыи объект совмещая два существующих объекта, которые передаются как аргументы //первым аргументом новыи аиди, вторым пришедшии из POST body

  tours.push(newTour); //пушим в массив туров новыи тур

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      //перезаписываем фаил с турами, записывая туда обновленныи массив
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      }); //201 статус - создан новыи ресурс на сервере
    }
  ); //всегда нужно отправить обратно что-нибудь чтобы завершить цикл запрос/ответ
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>', //updated tour placeholder
    },
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    //204 - нет контента
    status: 'success',
    data: null, //после удаления данные не отправляются, показываем что удаленный ресурс больше не существует
  });
};
