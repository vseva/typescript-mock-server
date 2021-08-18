const path = require('path');
const { readFileSync } = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const parser = require('./parser');
const { TypescriptParser } = require('typescript-parser');

const typeScriptParser = new TypescriptParser();
const app = express();
const PORT = 6007;
const SCHEMAS = {
  rec: path.resolve(__dirname, '../product-recruitment-app/recruitment/types/json-rpc.ts'),
  can: path.resolve(__dirname, '../product-recruitment-app/candidate/types/json-rpc.ts'),
};

app.use(cors());
app.use(bodyParser.json());

const typesCache = () => {
  const cache = {};

  return async (app) => {
    if (!cache[app]) {
      const SCHEMA = SCHEMAS[app];
      const { declarations } = await typeScriptParser.parseFile(SCHEMA, '');
      const methods = declarations.filter(d => d.name.startsWith('IJsonRpcMethod'));
      const files = [[SCHEMA, readFileSync(SCHEMA).toString()]];

      cache[app] = { methods, files };
    }

    return cache[app];
  }
}

const cache = typesCache();

const apiResponse = async (req, res, app) => {
  const request = req.body;

  if (!request) return {};

  const response = [];
  const { methods, files } = await cache(app);

  for (let i = 0; i < request.length; i++) {
    const { method, params, id } = request[i];
    const result = await parser({
      methodName: method,
      methodParams: params,
      methods,
      files,
    });

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

console.log(`mock started on port ${PORT}`);
