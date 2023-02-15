const express = require("express");

const app2 = express();

app2.set("view engine", "ejs");
app2.use(express.static("public"));

app2.get("/", function (req, res) {
  res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
  res.end('{"testcode":"200", "text":"Electorn Test~"}');
});

app2.get("/test", function (req, res) {
  res.render("notification", { title: "notification" });
});

app2.listen(3000, function () {
  console.log("test : http://127.0.0.1:3000/");
});

module.exports = app2;
