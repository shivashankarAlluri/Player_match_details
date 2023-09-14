const express = require("express");
const app = express();

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(`database Error ${e.message}`);
  }
};
initializeDBandServer();

//API 1
const convertDBandResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const playerQuery = `SELECT * FROM player_details;`;
  const Query = await database.all(playerQuery);
  response.send(Query.map((object) => convertDBandResponse(object)));
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `SELECT * FROM player_details
    WHERE player_id=${playerId};`;
  const Query = await database.get(playerQuery);
  response.send(convertDBandResponse(Query));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `UPDATE player_details
    SET 
    player_name='${playerName}'
    WHERE player_id=${playerId};`;
  const Query = await database.run(updateQuery);
  response.send("Player Details Updated");
});

//API 4
const convertDB = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `SELECT * FROM match_details
    WHERE match_id=${matchId};`;
  const matchQuery = await database.get(matchDetails);
  response.send(convertDB(matchQuery));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT match_id,match,year FROM
    player_match_score NATURAL JOIN match_details
    WHERE player_id=${playerId};`;
  const playerDetails = await database.all(query);
  console.log(playerDetails);
  response.send(playerDetails.map((eachPlayer) => convertDB(eachPlayer)));
});

//API 6
const convertDBtoResponse = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT player_id,player_name FROM
    player_match_score NATURAL JOIN player_details
    WHERE match_id=${matchId};`;
  const playerDetails = await database.all(query);
  console.log(playerDetails);
  response.send(
    playerDetails.map((eachPlayer) => convertDBtoResponse(eachPlayer))
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT player_details.player_id,player_details.player_name,SUM(player_match_score.score),SUM(player_match_score.fours),SUM(player_match_score.sixes) FROM player_match_score
    INNER JOIN player_details
    ON 
    player_match_score.player_id=player_details.player_id
    WHERE player_match_score.player_id=${playerId};`;
  const Query = await database.get(query);
  response.send({
    playerId: Query.player_id,
    playerName: Query.player_name,
    totalScore: Query["SUM(player_match_score.score)"],
    totalFours: Query["SUM(player_match_score.fours)"],
    totalSixes: Query["SUM(player_match_score.sixes)"],
  });
});
module.exports = app;
