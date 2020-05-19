const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync'); //чтобы не писать try-catch block используем catchAsync

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  }); //данные получаем из req.body и создаем нового пользователя по нашей модели, которая базируется на схеме //нельзя просто req.body, нужно указывать какие именно поля, которые мы позволяем и которые нужно положить в нового пользователя, так пользователь не сможет зарегистрироваться как админ, поскольку поле с ролью не пойдет в newUser

  const token = jwt.sign({ id: newUser._id }); //создаем токен. 1 аргумент - Payload, у нас id

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  }); //201 - успех. отправляем данные клиенту
});
