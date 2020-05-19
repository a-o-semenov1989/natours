class APIFeatures {
  constructor(query, queryString) {
    //вызывается автоматически, когда создается объект этого класса // передаем query mongoose и queryString express
    this.query = query; //this.query = query которую мы передаем в качестве аргумента //Tour.find()
    this.queryString = queryString; //this.queryString = queryString (req.query) которую мы передаем в качестве аргумента //req.query
  }

  filter() {
    //Filtering
    const queryObj = { ...this.queryString }; //новый объект, содержащий все что было в req.query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //регулярное выражение \b \b между ними точно совпадающее слово, одно из | - или, g - может случится несколько раз (если несколько операторов). 2 аргумент - колбэк, передаем в него совпавшее и возвращаем из него новую строку, которая заменит старую (добавит вначале $)

    this.query = this.query.find(JSON.parse(queryStr)); //как и в MongoDB, если мы ничего не передаем в find - покажутся все документы в коллекции //find - query method //query - часть url из запроса // Tour.find(queryObj); возвращает query, поэтому можно сделать цепочку из них //после ответа на await вернутся документы подходящие под наш query и уже нельзя будет применить дополнительные методы. //сначала строим query, затем выполняем
    //const query = await Tour.find().where('durations').equals(5).where('difficulty').equals('easy'); //вариант с использованием query methods из mongoose

    return this; //возвращаем this чтобы иметь возможность создать цепочку из методов, поскольку без return filter() ничего не вернет //this - объект целиком
  }

  sort() {
    if (this.queryString.sort) {
      //если пользователь указал sort
      const sortBy = this.queryString.sort.split(',').join(' '); //дополнительные опции  сортировки в url указываются через запятую -price,ratingsAverage //для mongoose, который ожидает строку с разделением пробелами - заменяем запятые на пробелы, для этого разделяем строку по запятым сплитом, и соединяем join обратно, разделитель пробел
      this.query = this.query.sort(sortBy); //подаставляем измененный query
    } else {
      this.query = this.query.sort('-createdAt'); //по умолчанию сортируются по дате создания в порядке убывания (-)
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      //если указано какие поля отобразить
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //по умолчанию убираем для показа пользователю поле -__v (для внутреннего пользования mongo), - - убрать поле, без -  - показать
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // *1 даст из строки цифру, поскольку цифра в query прийдет как строка // по дефолту будет 1-ая страница
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit; //страница - 1 = предыдущая страница * на лимит результатов на странице даст нам сколько пропустить документов чтобы показать нужную пользователю страницу

    this.query = this.query.skip(skip).limit(limit); //skip - сколько пропустить страниц и отобразить какую, лимит - сколько показать результатов на странице

    return this;
  }
}

module.exports = APIFeatures;
