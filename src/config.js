export const config = {
  endpointURL: "https://hdrezka.me/engine/ajax/search.php",
  maxLenght: 2000
};

const icons = {
  app: ".\\icons\\app.png",
  wait: ".\\icons\\waiting.png",
  notFound: ".\\icons\\notFound.png",
};

export const answer = {
  notFound: {
    title: "Ничего не найдено",
    iconPath: icons.notFound,
  },
  smallQuery: {
    title: "Ожидаем запрос",
    iconPath: icons.wait,
  }
};
