const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup); //в данном случае нужен только пост // исключение из REST
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protect all routes after this middleware
router.use(authController.protect); //ко всем роутам после этой точки применяется authController.protect - необходима авторизация (чтобы не писать в каждом этот middleware) //middlewares run in sequence

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
); //upload - для загрузки фото, single - один файл, в сингл передаем имя поля в форме где будет загружаться изображение //берет файл и копирует в указанное место
router.delete('/deleteMe', userController.deleteMe);

//All routes after this middleware are restricted to admin role
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
