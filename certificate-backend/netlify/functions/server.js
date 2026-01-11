const serverless = require('serverless-http');

// Load environment variables
require('dotenv').config();

// Import the Express app
const app = require('../../server.js');

// Export the serverless handler
exports.handler = serverless(app, {
    binary: ['image/*', 'application/pdf'],
    request: function (request, event, context) {
        // Add any custom request processing here
        return request;
    },
    response: function (response, event, context) {
        // Add any custom response processing here
        return response;
    }
});
