/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el); //если есть элемент - вернутся на уровень выше - на парент и убрать чайлд эл
};

//type is 'success' or 'error'
export const showAlert = (type, msg) => {
  hideAlert(); //убираем предыдущие алерты, если они есть
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup); //внутри body сразу вначале
  window.setTimeout(hideAlert, 5000); //убрать alert после 5 сек
};
