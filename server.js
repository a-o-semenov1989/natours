const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' }); //путь для фаила с конфигурациеи //прочитав фаил один раз - доступ к process будет везде

//console.log(process.env); //список переменных НОД для внутреннего пользования

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
