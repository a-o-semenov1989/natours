const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

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
