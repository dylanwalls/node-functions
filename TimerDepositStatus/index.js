const axios = require('axios');

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue) {
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);

    // URLs of the HTTP-triggered functions
    const httpFunctionUrl1 = 'https://python38-functions.azurewebsites.net/api/depositInterestCalc?code=UDBOfGGuESjm_UznLdbouSW7azBNnYDiOo7fTVgw6QOEAzFuc_L4aQ%3D%3D';
    const httpFunctionUrl2 = 'https://python38-functions.azurewebsites.net/api/depositStatus?code=rGLnNfM0TlY5f1GYMPRzA2T17Zq4VB_nOSMv3KgH5Jt3AzFuOmnSug%3D%3D';

    // Make a GET request to the first HTTP-triggered function
    try {
        const response1 = await axios.post(httpFunctionUrl1);
        context.log('First HTTP function called successfully:', response1.data);
    } catch (error) {
        context.log('Failed to call the first HTTP function:', error.message);
    }

    // Make a GET request to the second HTTP-triggered function
    try {
        const response2 = await axios.post(httpFunctionUrl2);
        context.log('Second HTTP function called successfully:', response2.data);
    } catch (error) {
        context.log('Failed to call the second HTTP function:', error.message);
    }
};
