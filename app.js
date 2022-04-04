const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3001

app.use("/healthcheck", require("./routes/healthcheck.js"));
app.use(express.urlencoded({ extended: true}));
app.use((cors()))
app.use(bodyParser.json());

app.get("/", (request, response) => {
    headers={"http_status":200, "cache-control": "no-cache"}
    body={"status":"available"}
    response.set('Content-Type', 'application/json');
    response.status(200).send(body)
})

app.listen(PORT, () => {
    console.log(`STARTED LISTENING ON PORT ${PORT}`)
});