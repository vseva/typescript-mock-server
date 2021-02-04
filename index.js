const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const parser = require('./parser');

const PORT = 6007;


const getMethodNames = (reqBody) => reqBody.map(m => m.method);


app.use(cors());
app.use(bodyParser.json());

/* /test?method=get-my-profile */
app.get('/test', async (req, res) => {
  const method = req.query.method;

  const result = await parser(method);

  res.json(result);
});

app.post('/api', async (req, res) => {
  const request = req.body;

  if (!request) return {};

  const response = [];
  //const methodNames = getMethodNames(request);

  for (let i = 0; i < request.length; i++) {
    const { method, params, id } = request[i];
    const result = await parser(method, params);

    response.push({
      jsonrpc: '2.0',
      result,
      id,
    });
  }

  res.json(response);
});

app.listen(PORT);

console.log(`Express started on port ${PORT}`);
