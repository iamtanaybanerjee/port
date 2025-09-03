const secureCookie = (res, token) => {
  console.log("Setting access_token cookie with maxAge:", 60 * 60 * 1000);
  res.cookie("access_token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000,
    secure: true,
  });
};

module.exports = secureCookie;
