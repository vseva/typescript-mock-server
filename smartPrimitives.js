const faker = require('faker');

const fakePhoneNumber = () => `+79${Math.floor(Math.random() * 1000000000)}`;

module.exports = (type, method) => {
    if (type === 'string') {
        if (method === 'get-phones-of-candidate-by-application-id') {
            return fakePhoneNumber();
        }
    }

    console.log('not caught smart primitive', type, method);

    return faker.fake('{{lorem.sentence}}');
};
