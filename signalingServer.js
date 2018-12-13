const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors')
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())

app.get('/', (req, res) => res.send('Hello World!'));

let offers = [];
let answers = [];
let candidates = [];

app.post('/offers', (req, res) => {
  offers.push(req.body);
  console.log("received offer", offers.length);
  res.send(offers[offers.length - 1])
});

app.get('/offers', (req, res) => res.send(offers[offers.length - 1]))

app.post('/answers', (req, res) => {
  answers.push(req.body);
  console.log("received answer", answers.length);
  res.send(answers[answers.length - 1])
});

app.get('/answers', (req, res) => res.send(answers[answers.length - 1]))

app.post('/candidates', (req, res) => {
  candidates.push(req.body);
  console.log("received ice candidate", candidates.length);
  res.send({message: "Candidate received"})
});

app.get('/candidates', (req, res) => {
  res.send({ candidates: candidates });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
