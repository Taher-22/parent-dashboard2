import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("OK - cors enabled");
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log("SERVER LISTENING ON", PORT);
});
