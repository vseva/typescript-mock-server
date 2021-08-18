const { TypescriptParser } = require('typescript-parser');
const { mock } = require('pdbr-intermock');
const faker = require('faker');

const smartPrimitives = require('./smartPrimitives');

const parser = new TypescriptParser();

const ARRAY_LENGTH = 5;

const isGlobalPermissionsRequest = (methodName) => methodName === 'global-permissions';
const isEntityPermissionsRequest = (methodName) => methodName === 'entity-permissions' || methodName === 'entity-permissions-v2';
const isRequisitionsRequest = (methodName) => methodName === 'get-requisitions';
const isSbAndComplianceForMassApplicationRequest = (methodName) => methodName === 'get-security-and-compliance-for-mass-application';
const isSbAndComplianceForNonMassApplicationRequest = (methodName) => methodName === 'get-candidate-security-and-compliance-comments';
const isHireModelRequest = (methodName) => methodName === 'get-model-of-application-by-application-id';
const isApplicationCompetenceRequest = (methodName) => methodName === 'get-job-application-competence';

const isArray = methodDeclaration => methodDeclaration.indexOf('[]') === methodDeclaration.length - 2;
const isPrimitive = (type) => type === 'string';

module.exports = async ({ methodName, methodParams, methods, files }) => {
  const doubleStringMethodName = `'${methodName}'`;
  const methodDeclaration = methods.find(method => {
      const methodProp = method.properties.find(prop => prop.name === 'method');

      return methodProp && methodProp.type === doubleStringMethodName;
  });

  const methodResponse = methodDeclaration.properties.find(prop => prop.name === 'response');
  const parsedMethodResponse = await parser.parseSource(methodResponse.type);
  const returnedStructure = methodResponse.type;
  const isArrayReturned = isArray(returnedStructure);
  const returnedType = isArrayReturned ? returnedStructure.split('[]')[0] : returnedStructure;

  /* если "ручка" возвращает не интерфейс а строку или массив строк */
  if (isPrimitive(returnedType)) {
    if (parsedMethodResponse.usages[3] !== undefined) {
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
    if(isSbAndComplianceForMassApplicationRequest(methodName)) {
      const mocked = mock(mockParams)[returnedType];
      mocked.compliance.complianceCheck = faker.random.arrayElement([
        'в работе',
        'можно нанимать',
        'не рекомендуется к трудоустройству',
        'есть замечания после проверки',
      ]);
      mocked.compliance.complianceCheckDate = new Date(faker.date.recent());
      mocked.security.sbCheck = faker.random.arrayElement([
        'в работе',
        'можно нанимать',
        'есть замечания после проверки',
        'не рекомендуется к трудоустройству',
        'ожидает проверки'
      ]);
      mocked.security.sbCheckDate = new Date(faker.date.recent());
      return mocked;
    }


    if(isHireModelRequest(methodName)){
      return faker.random.arrayElement([
          'GENERAL_EXTERNAL',
          'MASS_DIGITAL_EXTERNAL',
          'MASS_DIGITAL_STUDY',
          'GENERAL_INTERNAL',
      ]);
    }

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

  if(isRequisitionsRequest(methodName)){
    return [1,2,3,4,5,6,7,8,9].map((groupId) => {
      const mocked = mock(mockParams)[returnedType];
      return {
        ...mocked,
        groupId
      }
    })
  }

  if(isSbAndComplianceForNonMassApplicationRequest(methodName)){
    return Array.from(new Array(ARRAY_LENGTH)).map(() => {
      const mocked = mock(mockParams)[returnedType];
      mocked.security.processed = faker.random.arrayElement([
          'Проверен, есть замечания',
          'Трудоустройство не целесообразно',
          'Требуется дополнительное согласование комплаенс',
          'Сведений, препятствующих оформлению не найдено',
          'В работе',
      ]);
      mocked.compliance.processed = faker.random.arrayElement([
          'В части предоставленной информации в анкете кандидат согласован',
          'Не рекомендуется к трудоустройству',
          'Согласован при условии выполнения рекомендаций',
          'Для принятия решения требуется дополнительная информация',
          'В работе',
      ]);
      return mocked;
    });
  }

  if(isApplicationCompetenceRequest(methodName)){
      return Array.from(new Array(ARRAY_LENGTH)).map(() => {
          const mocked = mock(mockParams)[returnedType];
          mocked.value = faker.random.arrayElement([0, 50, 100]);
          return mocked;
      });
  }

  const mocked = mock(mockParams)[returnedType];

  return Array.from(new Array(ARRAY_LENGTH)).map(() => mocked);
};
