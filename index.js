const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const parser = require('./parser');

const PORT = 6007;

app.use(cors());
app.use(bodyParser.json());

/* /test?method=get-my-profile */
app.get('/test', async (req, res) => {
  const method = req.query.method;

  const result = await parser(method);

  res.json(result);
});

app.post('/api', async (req, res) => {
  if (!req.body) return {};

  const response = [];

  for (let i = 0; i < req.body.length; i++) {
    const result = await parser(req.body[i].method);

    response.push({
      jsonrpc: '2.0',
      id: req.body[i].id,
      result,
    });
  }

  res.json(response);
});

app.listen(PORT);

console.log(`Express started on port ${PORT}`);
