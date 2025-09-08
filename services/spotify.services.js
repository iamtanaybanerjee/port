const getArtists = (data) => {
  const artists = data.map((item) => item["name"]);
  return artists;
};

module.exports = { getArtists };
