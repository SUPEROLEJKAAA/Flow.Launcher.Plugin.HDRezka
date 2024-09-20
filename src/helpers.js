import axios from "axios";
import { JSDOM } from "jsdom";
import { config, answer } from "./config.js";
import { addData, getData } from "./db/db.js";

export async function getSearchResult(query) {
  const { data } = await axios(config.endpointURL, {
    params: {
      q: query,
    },
  });

  const result = [];
  const dom = new JSDOM(data);
  const { document } = dom.window;
  const li = document.querySelectorAll("ul.b-search__section_list li");

  li.forEach((li) => {
    const a = li.querySelector("a");
    const link = a.href;
    const title = a.querySelector("span.enty").textContent;
    const year = a.textContent.match(/\d{4}/)[0];
    result.push({
      title,
      year,
      link,
    });
  });

  if (result.length === 0) {
    return [answer.notFound];
  }

  result.sort((a, b) => b.year - a.year);
  return result;
}

async function getDataAboutMovie(url) {
  const { data } = await axios.get(url);
  const dom = new JSDOM(data);
  return dom.window.document;
}

function getImageForMovie(document) {
  const metaTag = document.querySelector('meta[property="og:image"]');
  return metaTag ? metaTag.getAttribute("content") : null;
}

function getLastEpisode(document) {
  const divElement = document.querySelector(
    ".b-post__lastepisodeout"
  ).textContent;
  const regex = /(\d+)\s+сезон\s+(\d+)\s+серия/;
  const data = divElement.match(regex)?.slice(1).map(Number) || null;
  if (divElement.includes("все серии")) {
    return [0, 0];
  }
  return data;
}

function getRating(document) {
  const ratingElement =
    document.querySelector(".b-post__info_rates.imdb .bold") ||
    document.querySelector(".b-post__info_rates.kp .bold");
  return ratingElement ? `★${ratingElement.textContent} ` : "N/A ";
}

function getDuration(document) {
  const rows = document.querySelectorAll("tr");
  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    if (cells[0].textContent === "Время:")
      return `| ${cells[1].textContent.trim()} `;
  }
  return "| N/A ";
}

function getSeasons(episodes) {
  if (!episodes[0] || !episodes[1]) return "";
  return `| S:${episodes[0]} E:${episodes[1]} `
}

function getDateNextEpisode(document, episodes) {
  if (!episodes[0] || !episodes[1]) return "| Сезон завершен";
  const table = document.querySelector(".b-post__schedule_table");
  const trElements = table.querySelectorAll("tr");
  for (const tr of trElements) {
    const td1 = tr.querySelector(".td-1");
    const td4 = tr.querySelector(".td-4");
    if (
      td1 &&
      td1.textContent.trim() === `${episodes[0]} сезон ${episodes[1] + 1} серия`
    )
      return `| ${td4.textContent.trim()}`;
  }
  return "| Сезон завершен";
}

function checkNewEpisode(link, episodes) {
  const oldDataMovie = getData(link);
  if (!oldDataMovie || !oldDataMovie.episodes || episodes[1] === 0) return "";
  const diff = episodes[1] - oldDataMovie.episodes[1];
  if (diff === 0) return "";
  const maxCount = Math.min(diff, 3);
  return "★".repeat(maxCount) + " | ";
}

async function preparingData(movies) {
  const contentTypes = {
    movie: {
      type: "🎬",
      getDuration: (doc) => getDuration(doc),
      getNextEpisode: () => "",
      getSeasons: () => "",
      checkNewEpisode: () => ""
    },
    series: {
      type: "📺",
      getDuration: () => "",
      getNextEpisode: (doc, eps) => getDateNextEpisode(doc, eps),
      getSeasons: (eps) => getSeasons(eps),
      checkNewEpisode: (link, eps) => checkNewEpisode(link, eps)
    }
  };

  return Promise.all(
    movies.map(async (movie) => {
      const document = await getDataAboutMovie(movie.link);
      const episodes = getLastEpisode(document);
      const contentType = episodes === null ? contentTypes.movie : contentTypes.series;
      
      return {
        ...movie,
        poster: getImageForMovie(document),
        episodes,
        rating: getRating(document),
        type: contentType.type,
        seasons: contentType.getSeasons(episodes),
        duration: contentType.getDuration(document),
        nextEpisode: contentType.getNextEpisode(document, episodes),
        indicator: contentType.checkNewEpisode(movie.link, episodes)
      };
    })
  );
}

export async function getResutMovies(movies) {
  if (movies[0].title === answer.notFound.title) {
    return [answer.notFound];
  }
  const data = await preparingData(movies);
  return data.map((movie) => {
    addData({link: movie.link, episodes: movie.episodes})
    return {
      title: `${movie.indicator}${movie.title}`,
      subtitle: `${movie.type} | ${movie.year} г. | ${movie.rating}${movie.duration}${movie.seasons}${movie.nextEpisode}`,
      method: "open_result",
      params: [`${movie.link}`, { link: movie.link, episodes: movie.episodes }],
      iconPath: movie.poster,
    };
  });
}
