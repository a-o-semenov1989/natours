const multer = require('multer'); //for user photo upload
const sharp = require('sharp'); //image processing library
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   //создаем хранилище для файлов и передаем ему опции //то как мы будем хранить загруженные файлы
//   destination: (req, file, cb) => {
//     //destination это по сути колбэк с доступом к реквесту, файлу и колбэку (cb). cb - как next в express
//     cb(null, 'public/img/users'); //чтобы определить destination надо вызвать КБ. Первым аргументом передаем - эррор (если есть, если нету - null), вторым - actual destination
//   },
//   filename: (req, file, cb) => {
//     //имена для файлов //используем для имени айди и таймстамп, чтобы имена файлов были точно уникальны и не перезаписывались
//     const ext = file.mimetype.split('/')[1]; //берем расширение (extension) файла из mimetype и разделяем строку по знаку '/' и берем второй элемент полученного массива //в console.log(req.file) видно mimetype загружаемого файла
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); //получится user-658765frbt8789-5459486496849.jpeg
//   },
// });
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

exports.uploadUserPhoto = upload.single('photo'); //используем multer для загрузки фото

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next(); //если файл не загружается - перейти к следующей middleware

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; //присваиваем имя файлу, также мы используем это имя в updateMe

  //в случае обработки файла перед сохранением - лучше сначала сохранить его в памяти, а потом на диск
  await sharp(req.file.buffer) //получаем загруженный файл из буффера
    .resize(500, 500) //меняем его размер на квадрат 500х500
    .toFormat('jpeg') //меняем формат на jpeg
    .jpeg({ quality: 90 }) //качество 90% от исходного
    .toFile(`public/img/users/${req.file.filename}`); //сохраняем итоговый файл на диск

  next(); //updateMe следующая middleware
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //создает объект с аргументами которые мы передадим, будет содержать поля, например имя и имеил
  Object.keys(obj).forEach((el) => {
    //проидет циклом по объекту и вернет массив содержащии имена ключеи
    if (allowedFields.includes(el)) newObj[el] = obj[el]; // далее проходим циклом forEach по объекту и если объект allowedFields содержит текущии элемент (текущее имя поля) - добавим в новыи объект
  });
  return newObj; //возвращаем новыи объект только с допустимымыми полями
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; //берем айди пользователя из authController.protect и записываем в req.params.id чтобы использовать в exports.getUser = factory.getOne(User); поскольку айди в URL нету
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //console.log(req.file); //загружаемый файл
  //console.log(req.body); //тело запроса

  //1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }

  //2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email'); //фильтруем req.body и указываем какие поля можно обновить (чтобы пользователь не мог например изменить своб роль и т.п.)
  if (req.file) filteredBody.photo = req.file.filename; //если в запросе есть файл - добавляем свойство photo в объкт, который будет обновлен в БД (в БД мы храним не сам файл, а имя файла) //filename видно в console.log(req.file)

  //3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }); //findByIdAndUpdate поскольку мы не имеем дело с паролями здесь можно использовать вместо save(), первыи аргумент - где обновить, второи - что (filteredBody), третии - опции (new: true - новыи обновленныи объект в БД и запуск валидаторов) //вторым аргументом нельзя передавать req.body поскольку в body может содержаться информацию которую мы не хотим передавать в БД, например изменить роль пользователя

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false }); //клиент залогинен, поэтому у нас есть его айди, находим по нему и меняем active на false. Таким образом аккаунт станет не активным (но не удаленным)

  res.status(204).json({
    status: 'success',
    data: null, //не отправляем данные, 204 - нет данных (удалено)
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    //internal status error - 500
    status: 'error', //когда 500 - error
    message: 'This route is not defined! Please use /signup instead.',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

//Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
