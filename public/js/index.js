/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';

//Dom elemens
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');

//Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  //console.log(locations);
  displayMap(locations); //вызываем функцию для отображения карты и передаем в нее локации
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);
