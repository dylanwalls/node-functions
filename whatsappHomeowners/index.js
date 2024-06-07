const { AzureFunction, Context, HttpRequest } = require("@azure/functions");
const fetch = require('isomorphic-fetch');

// Define the Azure Function
module.exports = async function (context, req) {
  try {
    if (req.method === "POST") {
      const jsonData = req.body; // JSON data sent in the request body

      // Call the function to send WhatsApp messages
      const successfullyMessagedHomeowners = await sendWhatsAppToHomeowners(jsonData, context);

      context.res = {
        status: 200,
        body: successfullyMessagedHomeowners,
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

// Function to send WhatsApp messages to homeowners
async function sendWhatsAppToHomeowners(parsedHomeowners, context) {
  context.log('Sending WhatsApp messages to homeowners');

  const successfullyMessagedHomeowners = []; // Array to store successfully messaged phone numbers

  // Loop through the homeowners and send WhatsApp messages
  for (const homeowner of parsedHomeowners) {
    try {
      await sendWhatsAppMessage(homeowner, context);
      successfullyMessagedHomeowners.push(homeowner.phone); // Add the successfully messaged number to the array
    } catch (error) {
      context.error('Failed to send WhatsApp message to', homeowner.phone, ':', error);
    }
  }

  return successfullyMessagedHomeowners;
}

// Function to send a WhatsApp message to a homeowner
async function sendWhatsAppMessage(homeowner, context) {
  context.log('Calling sendWhatsAppMessage for', homeowner.name);

  try {
    const { name, latest_statement, phone } = homeowner;
    const sendMessageOptions = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMTFkZjRkMDE2MjgzYTE1YjI4NDY3YjAyNGQzNDdkZjBkN2YyNWZmMjBkNzA0MmU1NDYyYTU1OTM0YjVlYjNlMmM5M2IyZmY4NDFmYWViNGMiLCJpYXQiOjE2ODgzOTYyMDIuMzI0NTI5LCJuYmYiOjE2ODgzOTYyMDIuMzI0NTMxLCJleHAiOjQ4MTI1MzM4MDIuMzE0MzY1LCJzdWIiOiI2MDY4NTQiLCJzY29wZXMiOltdfQ.MGKjhmw8mY-6tji1z4rsOG_9BTLTYasN6vgTNUjiFUeukAMz0sSTz4sFtifzV2L5Go4JIBooGYLeaKQfFIMHEA',
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        params: [
          { key: '{{1}}', value: name },
          { key: '{{2}}', value: latest_statement }
        ],
        recipient_phone_number: phone,
        hsm_id: '72589' // Replace with your WhatsApp template HSM ID
      })
    };

    const sendResponse = await fetch('https://app.trengo.com/api/v2/wa_sessions', sendMessageOptions);
    const sendData = await sendResponse.json();
    context.log('API Response:', sendData);
  } catch (error) {
    context.error(error);
    throw error;
  }
}
