const { BlobServiceClient } = require("@azure/storage-blob");
const fetch = async (...args) => {
    const module = await import('node-fetch');
    return module.default(...args);
};
const path = require('path');

// Assuming these are correctly set in your application's environment variables
const AZURE_STORAGE_CONNECTION_STRING = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const containerName = 'homeowner-statements';
const metadataFunctionUrl = "https://dashboard-function-app-1.azurewebsites.net/api/agreementsInsertPartnershipDocuments?code=mDE4b49vv31u8tpbeNE9Q_6-aVEvPrLuxOwWkmZtcKIFAzFu2EpjPA==";

module.exports = async function (context, req) {
    context.log('Starting document upload process.');

    const { fileName, fileContent, PartnershipID } = req.body;

    if (!fileName || !fileContent || !PartnershipID) {
        context.res = { status: 400, body: "Missing required fields in the request body." };
        return;
    }

    context.log('fileName:', fileName);
    context.log('fileContent:', fileContent);
    context.log('PartnershipID:', PartnershipID);

    try {
        // Decode the base64 content to binary
        const buffer = Buffer.from(fileContent, 'base64');

        context.log('Uploading document to Azure Blob Storage.');
        const pdfUrl = await uploadPdfToBlob(buffer, fileName);
        context.log(`Document uploaded successfully. URL: ${pdfUrl}`);

        // Insert metadata
        const metadataBody = {
            PartnershipID: PartnershipID,
            DocumentURL: pdfUrl,
            DocumentType: 'PDF', // Adjust this according to your application's needs
            FileName: fileName
        };

        context.log('Inserting document metadata.');
        const metadataResponse = await fetch(metadataFunctionUrl, {
            method: 'POST',
            body: JSON.stringify(metadataBody),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!metadataResponse.ok) {
            throw new Error('Failed to insert document metadata');
        }

        context.log('Document metadata inserted successfully.');
        context.res = { body: { message: "Document uploaded and metadata inserted successfully.", pdfUrl: pdfUrl } };
    } catch (error) {
        context.log(`Error processing the request: ${error}`);
        context.res = { status: 500, body: `Error processing the request: ${error.toString()}` };
    }
};

async function uploadPdfToBlob(pdfBuffer, fileName) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(pdfBuffer, {
        blobHTTPHeaders: { blobContentType: "application/pdf" }
    });

    // Return the URL to the uploaded PDF
    return blockBlobClient.url;
}
