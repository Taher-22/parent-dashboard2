import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("OK - express + json");
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log("SERVER LISTENING ON", PORT);
});
