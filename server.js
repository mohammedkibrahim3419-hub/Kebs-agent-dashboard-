const http = require("http");
const { ethers } = require("ethers");

const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("Kebs Agent Dashboard running!");
}).listen(PORT, () => console.log("Running on port", PORT));
