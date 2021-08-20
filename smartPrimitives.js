const fakePhoneNumber = () => `+79${Math.floor(Math.random() * 1000000000)}`;

const smartPrimitives = (type, method) => {
    if (type === 'string') {
        if (method === 'get-phones-of-candidate-by-application-id') {
            return fakePhoneNumber();
        }
    }

    return `[smartPrimitives.js type: ${type}, method: ${method}]`;
};

module.exports = smartPrimitives;
