// глобавльные переменные, используются в нескольких функциях
let moneySymbol, moneyCode;

// Функция для удаления атрибутов у элемента и его дочерних элементов через рекурсию
function removeAttributes(element) {
  while (element.attributes.length > 0) {
    element.removeAttribute(element.attributes[0].name);
  }
  
  for (let child of element.children) {
    removeAttributes(child);
  }
}

// получаем описание страницы из head
function getMeta() {
  const meta = {};

  meta.title = document.querySelector('title').textContent.split('—')[0].trim();
  meta.description = document.querySelector('[name="description"]').content.trim();
  meta.keywords = document.querySelector('[name="keywords"]').content.trim().split(', ');
  meta.language = document.documentElement.lang.trim();

  meta.opengraph = {};
  document.querySelectorAll('[property^="og:"]').forEach(item => { // Находим все теги og разметки
    let ogName = item.getAttribute('property').trim().split(':')[1];
    
    if (ogName == 'title') { // У title удаляем всю правую часть, начиная с тире (видимо, это &mdash;)
      meta.opengraph[ogName] = item.content.split('—')[0].trim();
    } else {
      meta.opengraph[ogName] = item.content.trim();
    }
  });

  return meta;
}

// получаем описанием товара
function getProduct() {
  const product = {};
  const price = document.querySelector('.price').textContent.trim();
  // клонируем описание товара для последующего удаления атрибутов
  const cloneDescriptionElement = document.querySelector('.description').cloneNode(true);

  // конструкцию switch с true использую давно в своей работе, удобно
  switch (true) {
    case (~price.indexOf('$')): // трюк с побитовым НЕ для обхода проблемы, если наш символ - первый (нулевой индекс)
      moneySymbol = '$';
      product.currency = moneyCode = 'USD';
      break;
    case (~price.indexOf('€')):
      moneySymbol = '€';
      product.currency = moneyCode = 'EUR';
      break;
    default:
      moneySymbol = '₽';
      product.currency = moneyCode = 'RUB';
  }

  const splitPrices = price.split(moneySymbol);

  product.id = document.querySelector('.product').dataset.id;
  product.name = document.querySelector('.title').textContent.trim();
  product.isLiked = document.querySelector('.like').classList.contains('active');

  product.tags = {};
  // children отдает HTMLCollection, с ним forEach не работает
  // можно заменить селектор с .tags на .tags span
  // а можно использовать оператор расширения в пустом массиве
  [...document.querySelector('.tags').children].forEach(tag => {
    let tagName = '';

    switch (true) {
      case (tag.classList.contains('green')):
        tagName = 'category';
        break;
      case (tag.classList.contains('blue')):
        tagName = 'label';
        break;
      case (tag.classList.contains('red')):
        tagName = 'discount';
        break;
    }

    // оператор нулевого присваивания на случай отсутствующего массива
    product.tags[tagName] ??= [];
    product.tags[tagName].push(tag.textContent.trim());
  });

  // естесственно, числовые значения переводим в тип number через унарный плюс
  product.price = +splitPrices[1];
  if (splitPrices.length > 2) {
    product.oldPrice = +splitPrices[2];
    product.discount = product.oldPrice - product.price;
    product.discountPercent = (100 - product.price * 100 / product.oldPrice).toFixed(2) + '%';
  }

  product.properties = {};
  document.querySelectorAll('.properties li').forEach(li => {
    product.properties[li.children[0].textContent.trim()] = li.children[1].textContent.trim();
  });

  removeAttributes(cloneDescriptionElement); // предварительно удаляем все атрибуты у тегов
  product.description = cloneDescriptionElement.innerHTML.trim();

  product.images = [];
  document.querySelectorAll('.preview nav img').forEach(img => {

    product.images.push({
      'preview': img.src.trim(),
      'full': img.dataset.src,
      'alt': img.alt.trim()
    });
  });

  return product;
}

// получаем предлагаемые товары
function getSuggesteds() {
  const suggested = [];

  document.querySelectorAll('.suggested article').forEach(article => {
    let objSuggested = {};

    objSuggested.name = article.querySelector('h3').textContent.trim();
    objSuggested.description = article.querySelector('p').textContent.trim();
    objSuggested.image = article.querySelector('img').src;
    objSuggested.price = article.querySelector('b').textContent.trim().substring(1);
    objSuggested.currency = moneyCode;

    suggested.push(objSuggested);
  });

  return suggested;
}

// получаем отзывы о товаре
function getReviews() {
  const reviews = [];

  document.querySelectorAll('.reviews article').forEach(review => {
    let objReview = {};
    const authorElement =  review.querySelector('.author');

    objReview.rating = review.querySelectorAll('.rating .filled').length;
    objReview.title = review.querySelector('.title').textContent.trim();
    objReview.description = review.querySelector('.title + p').textContent.trim();
    objReview.date = authorElement.querySelector('i').textContent.trim().split('/').join('.');

    objReview.author = {};
    objReview.author.avatar = authorElement.querySelector('img').src;
    objReview.author.name = authorElement.querySelector('span').textContent.trim();

    reviews.push(objReview);
  });

  return reviews;
}

// собираем итоговые данные
function parsePage() {
    return {
        meta: getMeta(),
        product: getProduct(),
        suggested: getSuggesteds(),
        reviews: getReviews()
    };
}

// отправляем в глобальный объект window, видимо для автотестов
window.parsePage = parsePage;