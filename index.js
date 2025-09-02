const express = require("express");
const cors = require("cors");
const path = require("path");
require("pg");

const app = express();

app.use(express.json());
app.use(cors());

// serve static files from public
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
