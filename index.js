const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const parser = require('./parser');

const PORT = 6007;


const getMethodNames = (reqBody) => reqBody.map(m => m.method);


app.use(cors());
app.use(bodyParser.json());

const apiResponse = async (req, res, app) => {
  const request = req.body;

  if (!request) return {};

  const response = [];
  //const methodNames = getMethodNames(request);

  for (let i = 0; i < request.length; i++) {
    const { method, params, id } = request[i];
    const result = await parser(method, params, app);

    response.push({
      jsonrpc: '2.0',
      result,
      id,
    });
  }

  res.json(response);
};

app.post('/mock-api-rec', (req, res) => {
  apiResponse(req, res, 'rec');
});

app.post('/mock-api-can', (req, res) => {
  apiResponse(req, res, 'can');
});

app.listen(PORT);

console.log(`Express started on port ${PORT}`);
