// generateSecret.js
const crypto = require('crypto');

// Generate a random string of 32 characters
const generateRandomString = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Call the function to generate the random string
const randomString = generateRandomString();

console.log('Random String:', randomString);


