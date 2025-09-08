const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models");
const {
  spotifyLogin,
  spotifyCallback,
  refreshAccessToken,
  getCurrentlyPlayingTrack,
  getUserTop10Tracks,
  pausePlayingTrack,
  playTrack,
} = require("./controllers/spotify.controllers");
require("pg");

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

//spotify oauth routes
app.get("/spotify", spotifyLogin);
app.get("/spotify/callback", spotifyCallback);
app.post("/spotify/refresh_token", refreshAccessToken);
app.get("/spotify/get_currently_playing_song", getCurrentlyPlayingTrack);
app.get("/spotify/user_top_10_tracks", getUserTop10Tracks);
app.put("/spotify/pause_current_track", pausePlayingTrack);
app.put("/spotify/play_track", playTrack);

// Error handling middleware (add this after all routes)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    // Custom response for bad JSON
    return res.status(400).json({ error: "Malformed or missing JSON body" });
  }
  next();
});

// serve static files from public
app.use(express.static(path.join(__dirname, "public")));
// //spotify oauth routes
// app.get("/spotify", spotifyLogin);
// app.get("/spotify/callback", spotifyCallback);
// app.post("/refresh_token", refreshAccessToken);

sequelize
  .authenticate()
  .then(() => console.log("DB is connected"))
  .catch((error) => console.log("Failed to connect to DB", error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
