const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const { BlobServiceClient } = require('@azure/storage-blob');
let fetch;

async function loadDependencies() {
    if (!fetch) {
        fetch = (await import('node-fetch')).default;
    }
}
const fs = require('fs');
const os = require('os');
const path = require('path');

// Assuming these are correctly set in your application's environment variables
const AZURE_STORAGE_CONNECTION_STRING = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const containerName = 'homeowner-statements';
const metadataFunctionUrl = "https://dashboard-function-app-1.azurewebsites.net/api/agreementsInsertPartnershipDocuments?code=mDE4b49vv31u8tpbeNE9Q_6-aVEvPrLuxOwWkmZtcKIFAzFu2EpjPA==";

module.exports = async function(context, req) {
    await loadDependencies();
    const { pdfUrls, outputFileName, PartnershipId } = req.body;
    
    // Ensure pdfUrls and outputFileName are provided
    if (!pdfUrls || !outputFileName || !PartnershipId) {
        context.res = {
            status: 400,
            body: "Missing required fields in the request body."
        };
        return;
    }

    const downloadedPdfPaths = await downloadPdfs(pdfUrls);

    try {
        const combinedPdfPath = await combinePDFs(downloadedPdfPaths, outputFileName, context);
        context.log(`Uploading combined PDF from path: ${combinedPdfPath}`);
        if (!combinedPdfPath) {
            throw new Error("Combined PDF path is undefined");
        }
        const pdfUrl = await uploadPdfToBlob(combinedPdfPath, outputFileName, context);
        await insertDocumentMetadata(PartnershipId, pdfUrl, outputFileName, context);

        // Return the URL of the uploaded combined PDF
        context.res = {
            body: { message: "PDFs combined successfully, uploaded, and metadata updated.", pdfUrl: pdfUrl }
        };
    } catch (error) {
        context.log(`Error in combining PDFs or updating metadata: ${error}`);
        context.res = {
            status: 500,
            body: `Error in combining PDFs or updating metadata: ${error.message}`
        };
    } finally {
        downloadedPdfPaths.forEach(filePath => fs.unlinkSync(filePath));
    }
};

async function downloadPdfs(pdfUrls) {
    const tempDir = os.tmpdir();
    const downloadedPdfPaths = [];

    for (const url of pdfUrls) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch PDF from ${url}`);
        const tempFilePath = path.join(tempDir, path.basename(url));
        const buffer = await response.buffer();
        fs.writeFileSync(tempFilePath, buffer);
        downloadedPdfPaths.push(tempFilePath);
    }

    return downloadedPdfPaths;
}

async function combinePDFs(pdfPaths, outputFileName, context) {
    const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
        .withClientId('706671304abe4520b31d650bcf3b09ee')
        .withClientSecret('p8e-MhPcIrM2cvJmOmnlw0eMyK7rpw0gEZ7L')
        .build();

    const executionContext = PDFServicesSdk.ExecutionContext.create(credentials),
          combineFilesOperation = PDFServicesSdk.CombineFiles.Operation.createNew();

    pdfPaths.forEach(pdfPath => {
        const pdfFileRef = PDFServicesSdk.FileRef.createFromLocalFile(pdfPath);
        combineFilesOperation.addInput(pdfFileRef);
    });

    try {
        const result = await combineFilesOperation.execute(executionContext);
        // Define a path where the combined PDF should be saved
        const combinedPdfPath = path.join(os.tmpdir(), outputFileName);
        await result.saveAsFile(combinedPdfPath);
        context.log(`Combined PDF saved as: ${combinedPdfPath}`);
        if (!combinedPdfPath) {
            throw new Error("Failed to generate combined PDF path");
        }
        return combinedPdfPath;
    } catch (error) {
        throw error; // Rethrow to handle in the main function
    }
}

async function uploadPdfToBlob(filePath, fileName, context) {
    if (typeof filePath !== 'string' || !fs.existsSync(filePath)) {
        throw new Error(`Invalid file path: ${filePath}`);
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadFile(filePath, {
        blobHTTPHeaders: { blobContentType: "application/pdf" }
    });
    // After successful upload, return the URL to the uploaded PDF
    return blockBlobClient.url;
}

// Function to insert document metadata
async function insertDocumentMetadata(PartnershipId, pdfUrl, fileName, context) {
    const response = await fetch(metadataFunctionUrl, {
        method: 'POST',
        body: JSON.stringify({
            PartnershipID: PartnershipId,
            DocumentURL: pdfUrl,
            DocumentType: "PDF",
            FileName: fileName
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`Failed to insert document metadata for PartnershipId: ${PartnershipId}`);
    }

    context.log(`Document metadata inserted successfully for PartnershipId: ${PartnershipId}`);
}