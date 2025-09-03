const crypto = require("crypto");
const querystring = require("querystring");
require("dotenv").config();

//const redirect_uri = "https://cinebuff-ten.vercel.app/api/spotify/callback";
const redirect_uri = "https://port-jade-mu.vercel.app/spotify/callback";

const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString("hex").slice(0, length);
};

const stateKey = "spotify_auth_state";

const spotifyLogin = async (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);
  const scope =
    "user-read-currently-playing user-modify-playback-state user-top-read";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
};

const spotifyCallback = async (req, res) => {
  // your application requests refresh and access tokens
  // after checking the state parameter

  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code,
          redirect_uri: redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      const data = await response.json();
      console.log(data);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const refresh_token = req.body.refresh_token;

    const authHeader =
      "Basic " +
      Buffer.from(client_id + ":" + client_secret).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).send({
        access_token: data.access_token,
        refresh_token: data.refresh_token, // Spotify may not always send a new one
      });
    } else {
      res.status(response.status).send({
        error: data.error || "Failed to refresh token",
        details: data,
      });
    }
  } catch (err) {
    console.error("Error refreshing token:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

module.exports = { spotifyLogin, spotifyCallback, refreshAccessToken };
