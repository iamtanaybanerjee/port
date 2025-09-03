const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const { sequelize } = require("./models");
const {
  spotifyLogin,
  spotifyCallback,
} = require("./controllers/spotify.controllers");
require("pg");

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

// serve static files from public
app.use(express.static(path.join(__dirname, "public")));
//spotify oauth routes
app.get("/spotify", spotifyLogin);
app.get("/spotify/callback", spotifyCallback);

sequelize
  .authenticate()
  .then(() => console.log("DB is connected"))
  .catch((error) => console.log("Failed to connect to DB", error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
