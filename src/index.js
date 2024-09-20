import open from "open";
import { Flow } from "flow-launcher-helper";
import { getResutMovies, getSearchResult } from "./helpers.js";
import { addData} from "./db/db.js";
import { answer } from "./config.js";

const { on, showResult, run, requestParams } = new Flow();

on("query", async () => {
  const query = requestParams[0];
  if(query.length === 0) {
    return showResult(...[answer.smallQuery])
  }
  const movies = await getSearchResult(query)
  const result = await getResutMovies(movies);
  return showResult(...result);
});

on("open_result", () => {
  const movie = {link: requestParams[1].link, episodes: requestParams[1].episodes}
  addData(movie)
  open(requestParams[0]);
});

run();
