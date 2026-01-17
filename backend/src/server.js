import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("OK - minimal server");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("MINIMAL SERVER LISTENING ON", PORT);
});
