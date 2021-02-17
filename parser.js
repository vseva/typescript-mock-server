const { TypescriptParser } = require('typescript-parser');
const { mock } = require('pdbr-intermock');

const smartPrimitives = require('./smartPrimitives');

const parser = new TypescriptParser();

const ARRAY_LENGTH = 5;

const isGlobalPermissionsRequest = (methodName) => methodName === 'global-permissions';
const isEntityPermissionsRequest = (methodName) => methodName === 'entity-permissions';

const isArray = methodDeclaration => methodDeclaration.indexOf('[]') === methodDeclaration.length - 2;
const isPrimitive = (type) => type === 'string';

module.exports = async ({ methodName, methodParams, methods, files }) => {
  const methodDeclaration = methods.properties.find(d => d.name === methodName);
  const parsedMethod = await parser.parseSource(methodDeclaration.type);

  const { usages } = parsedMethod;
  const isArrayReturned = isArray(methodDeclaration.type);
  const returnedType = usages[2];

  /* если "ручка" возвращает не интерфейс а строку или массив строк */
  if (isPrimitive(returnedType)) {
    if (usages[3] !== undefined) {
      /* если "ручка" возвращает string[]
      * ['params',
      * 'IJsonRpcMethodGetPhonesOfCandidateByApplicationIdRequest',
      * 'string',
      * ''] */
      return Array.from(new Array(ARRAY_LENGTH)).map(() => smartPrimitives(returnedType, methodName));
    }

    /* если возвращает string
     * ['params',
     * 'IJsonRpcMethodGetPhonesOfCandidateByApplicationIdRequest',
     * 'string']
     * */
    return smartPrimitives(returnedType, methodName);
  }

  const mockParams = {
    files,
    interfaces: [returnedType],
    output: 'object',
    isOptionalAlwaysEnabled: true,
  };

  if (methodName === 'get-requisition-short-info') {
    return {
      ...mock(mockParams)[returnedType],
      id: methodParams['job-requisition-id'],
    };
  }

  if (!isArrayReturned) {
    return mock(mockParams)[returnedType];
  }

  if (isGlobalPermissionsRequest(methodName)) {
    const requestedEntities = methodParams.entityTypes;

    return Array.from(new Array(requestedEntities.length))
        .map((el, idx) => {
          const mocked = mock(mockParams)[returnedType];

          return {
            ...mocked,
            entityType: requestedEntities[idx],
          };
        });
  }

  if (isEntityPermissionsRequest(methodName)) {
    const requestedEntities = methodParams.entities;

    return Array.from(new Array(requestedEntities.length))
        .map((el, idx) => {
          const mocked = mock(mockParams)[returnedType];

          return {
            ...mocked,
            entityType: requestedEntities[idx].entityType,
            entityId: requestedEntities[idx].entityId,
          };
        });
  }

  return Array.from(new Array(ARRAY_LENGTH)).map(() => mock(mockParams)[returnedType]);
};
