const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

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
