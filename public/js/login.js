/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      //axios (возвращает promise) для http запроса, указываем метод, url и данные, которые идут вместе з запросом
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email, //email: email
        password,
      },
    });

    if (res.data.status === 'success') {
      //если ответ на запрос пришел со статусом success
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        //если залогинились - через 1,5 секунды перейти на главное о
        location.assign('/');
      }, 1500);
    }

    //console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message); //сообщение из нашего json ответа
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.reload(true); //если разлогинились - перезапустить страницу с сервера
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
