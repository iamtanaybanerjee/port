const crypto = require("crypto");
const querystring = require("querystring");
require("dotenv").config();
const secureCookie = require("../services/secureCookie.service");
const { getArtists } = require("../services/spotify.services");

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
  console.log("✅ Hit /spotify/callback route");
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

      //   secureCookie(res, data["access_token"]);
      res.cookie("access_token", data["access_token"]);
      return res.json(data);
      //   return res.json({
      //     access_token: data["access_token"],
      //     refresh_token: data["refresh_token"],
      //   });
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
      Buffer.from(
        process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
      ).toString("base64");

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

    secureCookie(res, data.access_token);

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

const getCurrentlyPlayingTrack = async (req, res) => {
  try {
    const access_token = req.cookies.access_token;
    if (!access_token)
      return res.status(401).json({ error: "No access token is found" });

    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing?market=IN",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    // handle no content
    if (response.status === 204) {
      return res.status(200).json({ message: "No track is currently playing" });
    }

    // handle expired/invalid token
    if (response.status === 401) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }

    const data = await response.json();
    const artists = data["item"]["artists"].map((item) => item["name"]);
    const currentTrack = {
      name: data["item"]["name"],
      trackId: data["item"]["id"],
      albumName: data["item"]["album"]["name"],
      duration: data["item"]["duration_ms"],
      artists,
      uri: data["item"]["uri"],
    };
    return res.status(200).json({ currentTrack });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getUserTop10Tracks = async (req, res) => {
  try {
    const access_token = req.cookies.access_token;
    if (!access_token)
      return res.status(401).json({ error: "No access token is found" });

    const response = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?limit=10",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    // handle no content
    if (response.status === 204) {
      return res.status(404).json({ message: "No tracks are found" });
    }
    // handle expired/invalid token
    else if (response.status === 401) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }

    const data = await response.json();

    const topTracks = data["items"].map((item) => {
      return {
        name: item["name"],
        trackId: item["id"],
        albumName: item["album"]["name"],
        duration: item["duration_ms"],
        artists: getArtists(item["artists"]),
        uri: item["uri"],
      };
    });

    return res.status(200).json({ topTracks });
    // return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const pausePlayingTrack = async (req, res) => {
  try {
    const access_token = req.cookies.access_token;
    if (!access_token)
      return res.status(401).json({ error: "No access token is found" });

    const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (response.status === 403)
      return res
        .status(403)
        .json({ message: "Premium required to use this feature" });
    else if (response.status === 401)
      return res.status(401).json({ error: "Invalid or expired access token" });
    else if (response.status === 404)
      return res.status(404).json({ error: "No active device found" });
    else if (response.status === 204)
      return res.status(200).json({ message: "Playback paused" });
    else
      return res
        .status(response.status)
        .json({ error: "Unexpected response from Spotify API" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const playTrack = async (req, res) => {
  try {
    const access_token = req.cookies.access_token;
    const trackUri = req.body.trackUri;
    if (!access_token)
      return res.status(401).json({ error: "No access token is found" });

    if (!req.body || !trackUri)
      return res.status(400).json({ error: "Track URI is required" });

    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: [trackUri],
      }),
    });

    if (response.status === 403)
      return res
        .status(403)
        .json({ message: "Premium required to use this feature" });
    else if (response.status === 401)
      return res.status(401).json({ error: "Invalid or expired access token" });
    else if (response.status === 404)
      return res.status(404).json({ error: "No active device found" });
    else if (response.status === 204)
      return res.status(200).json({ message: "Playback started" });
    else
      return res
        .status(response.status)
        .json({ error: "Unexpected response from Spotify API" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  spotifyLogin,
  spotifyCallback,
  refreshAccessToken,
  getCurrentlyPlayingTrack,
  getUserTop10Tracks,
  pausePlayingTrack,
  playTrack,
};
