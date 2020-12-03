const { TypescriptParser } = require('typescript-parser');
const { mock } = require('intermock');
const path = require('path');
const { readFileSync } = require('fs');
const smartPrimitives = require('./smartPrimitives');

const parser = new TypescriptParser();

const ARRAY_LENGTH = 5;
const RECRUITMENT_BACKEND_SCHEMA = path.resolve(__dirname, '../product-recruitment-app/src/types/json-rpc.ts');
const METHODS_ROOT = 'IJsonRpcMethods';

const isArray = methodDeclaration => {
  return methodDeclaration.indexOf('[]') === methodDeclaration.length - 2;
};

const isPrimitive = (type) => type === 'string';

module.exports = async methodName => {
  const parsed = await parser.parseFile(RECRUITMENT_BACKEND_SCHEMA, '');
  const { declarations } = parsed;

  const jsonRpcMethods = declarations.find(d => d.name === METHODS_ROOT);
  const methodDeclaration = jsonRpcMethods.properties.find(d => d.name === methodName);
  const parsedMethod = await parser.parseSource(methodDeclaration.type);

  const { usages } = parsedMethod;
  const isArrayReturned = isArray(methodDeclaration.type);
  const returnedType = usages[2];

  if (isPrimitive(returnedType)) {
    if (usages[3] !== undefined) {
      /* если возвращается string[] то парсится так
      * ['params',
      * 'IJsonRpcMethodGetPhonesOfCandidateByApplicationIdRequest',
      * 'string',
      * '']
      * а если возвращается string то парсится так
      * ['params',
      * 'IJsonRpcMethodGetPhonesOfCandidateByApplicationIdRequest',
      * 'string']
      * */
      const result = [];

      for (let i = 0; i <= ARRAY_LENGTH; i++) {
        result.push(smartPrimitives(returnedType, methodName));
      }

      return result;
    }

    return smartPrimitives(returnedType, methodName);
  }

  const params = {
    files: [[RECRUITMENT_BACKEND_SCHEMA, readFileSync(RECRUITMENT_BACKEND_SCHEMA).toString()]],
    interfaces: [returnedType],
    output: 'object',
    isOptionalAlwaysEnabled: true,
  };

  if (!isArrayReturned) {
    return mock(params)[returnedType];
  }

  const result = [];

  for (let i = 0; i <= ARRAY_LENGTH; i++) {
    result.push(mock(params)[returnedType]);
  }

  return result;
};
