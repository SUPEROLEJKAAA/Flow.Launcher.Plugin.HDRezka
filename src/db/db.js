import fs from "fs";
import { config } from "../config.js";

const dbPath = new URL("db.json", import.meta.url).pathname.slice(1);

function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return { history: []};
  }
}

function writeDatabase(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
}

export function addData(movie) {
  if (!movie.episodes) return null;
  const db = readDatabase(dbPath);
  const foundIndex = db['history'].findIndex((item) => item.link === movie.link);
  if(foundIndex !== -1) {
    db["history"].splice(foundIndex, 1)
  }
  db['history'].unshift(movie);
  if(db['history'].length > config.maxLenght) {
    db.history.length = config.maxLenght
  }
  writeDatabase(db);
}

export function getData(link) {
  const db = readDatabase(dbPath);
  const found = db['history'].filter((movie) => movie.link === link);
  if (found.length > 0) {
    return found[0];
  }
  return null;
}
