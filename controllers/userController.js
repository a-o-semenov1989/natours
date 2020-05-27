const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //создает объект с аргументами которые мы передадим, будет содержать поля, например имя и имеил
  Object.keys(obj).forEach((el) => {
    //проидет циклом по объекту и вернет массив содержащии имена ключеи
    if (allowedFields.includes(el)) newObj[el] = obj[el]; // далее проходим циклом forEach по объекту и если объект allowedFields содержит текущии элемент (текущее имя поля) - добавим в новыи объект
  });
  return newObj; //возвращаем новыи объект только с допустимымыми полями
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  //SEND RESPONSE
  res.status(200).json({
    //в методе статус мы определяем код ответа //в методе send можно написать ответ //методом json можно отправить json и автоматически ставится content-type application/json
    //указываем статус, и используем спецификацию jsend для отправки json
    status: 'success',
    results: users.length, // в случае отправки массива, не часть спец. jsend, клиенту будет видно количество туров
    data: {
      users, //users: users(результат const users)
    },
  });
});

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

exports.getUser = (req, res) => {
  res.status(500).json({
    //internal status error - 500
    status: 'error', //когда 500 - error
    message: 'This route is not yet defined!',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    //internal status error - 500
    status: 'error', //когда 500 - error
    message: 'This route is not yet defined!',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    //internal status error - 500
    status: 'error', //когда 500 - error
    message: 'This route is not yet defined!',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    //internal status error - 500
    status: 'error', //когда 500 - error
    message: 'This route is not yet defined!',
  });
};
