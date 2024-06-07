const { AzureFunction, Context, HttpRequest } = require("@azure/functions");
const fetch = require('isomorphic-fetch');

module.exports = async function (context, req) {
  try {
    if (req.method === "POST") {

      const jsonData = req.body;

      context.log('Received request body:', JSON.stringify(jsonData, null, 2));
      
      const successfullyMessagedNumbers = await sendWhatsAppMessages(jsonData, context);

      context.res = {
        status: 200,
        body: successfullyMessagedNumbers,
      };
    } else {
      context.res = {
        status: 400,
        body: "Invalid HTTP method. Use POST.",
      };
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: "An error occurred: " + error.message,
    };
  }
};

async function sendWhatsAppMessages(data, context) {
  context.log('Sending WhatsApp messages');

  const successfullyMessagedNumbers = [];

  for (const recipient of data.recipients) {
    context.log('Recipient: ', recipient);
    try {
      const { phone, hsm_id, parameters } = recipient;
      const sendMessageOptions = {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjdjZjk5YmM5ZGFlODQ2Zjg5MzA0YzBmYzRmMWI5NWYwMWE4MjRjMDVkZDAxY2M3ZDlkY2FlMDEzZTIxOWM4ZDVlNzE3OTNlYThmOTE4ZTciLCJpYXQiOjE3MDk1NTY3MzAuMjE4OTE4LCJuYmYiOjE3MDk1NTY3MzAuMjE4OTIsImV4cCI6NDgzMzYwNzkzMC4yMTA0MzQsInN1YiI6IjYwNjg1NCIsInNjb3BlcyI6W119.e72mA4u-ID81C85d1ajz-PKuPMvA8LgvnPayWI3y2DQZv4ya7K9iqYFUJalHImF0x6yeXzzkG9MCwAMLFR2zxg',
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          params: parameters.map((param, index) => ({ key: `{{${index + 1}}}`, value: param.value.toString() })),
          recipient_phone_number: phone,
          hsm_id: hsm_id
        })
      };

      // context.log('PARAMS BEING SENT: ', body);

      const sendResponse = await fetch('https://app.trengo.com/api/v2/wa_sessions', sendMessageOptions);
      const sendData = await sendResponse.json();
      context.log('API Response:', sendData);

      successfullyMessagedNumbers.push(phone);
    } catch (error) {
      context.log.error('Failed to send WhatsApp message:', error);
    }
  }

  return successfullyMessagedNumbers;
}
