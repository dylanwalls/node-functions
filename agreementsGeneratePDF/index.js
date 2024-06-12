const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const { BlobServiceClient } = require('@azure/storage-blob');
const fetch = async (...args) => {
    const module = await import('node-fetch');
    return module.default(...args);
};
const path = require('path');
const fs = require('fs');
const os = require('os');

// Assuming these are correctly set in your application's environment variables
const AZURE_STORAGE_CONNECTION_STRING = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const containerName = 'homeowner-statements';
const metadataFunctionUrl = "https://dashboard-function-app-1.azurewebsites.net/api/agreementsInsertPartnershipDocuments?code=mDE4b49vv31u8tpbeNE9Q_6-aVEvPrLuxOwWkmZtcKIFAzFu2EpjPA==";

module.exports = async function (context, req) {
    context.log('Starting PDF generation and upload process.');

    const { templateFileName, jsonData, PartnershipID } = req.body;

    if (!templateFileName || !jsonData || !PartnershipID) {
        context.log('Missing required fields in the request body.');
        context.res = { status: 400, body: "Missing required fields in the request body." };
        return;
    }

    try {
        context.log('Generating PDF.');
        context.log('jsonData:', jsonData);
        const pdfBuffer = await generatePDF(context, templateFileName, jsonData);
        context.log('PDF generated successfully.');

        context.log('Uploading PDF to Azure Blob Storage.');
        const pdfUrl = await uploadPdfToBlob(pdfBuffer, `${templateFileName}_${Date.now()}.pdf`);
        context.log(`PDF uploaded successfully. URL: ${pdfUrl}`);

        const now = new Date();
        const sastTimeOffset = now.getTime() + (2 * 60 * 60 * 1000); // Adding 2 hours in milliseconds
        const sastDate = new Date(sastTimeOffset);

        // Format date and time in "YYYY-MM-DD HH:MM" format
        const dateCreated = sastDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
        const timeCreated = sastDate.toISOString().slice(11, 16); // "HH:MM" from ISO string
        const dateTimeCreated = `${dateCreated} ${timeCreated}`;
        const fullNames = jsonData.fullNames;
        let fileNameFormatted;
        switch (templateFileName) {
            case "notarial_lease_template.docx":
                fileNameFormatted = `Notarial Lease Agreement between ${fullNames} and Bitprop ${dateTimeCreated}.pdf`;
                break;
            case "cession_agreement_bitprop_mpdf_template.docx":
                fileNameFormatted = `Cession Agreement between MPDF and Bitprop ${dateTimeCreated}.pdf`;
                break;
            case "loan_agreement_mpdf_bitprop_template.docx":
                fileNameFormatted = `Loan Agreement between MPDF and Bitprop ${dateTimeCreated}.pdf`;
                break;
            default:
                fileNameFormatted = `Agreement between ${fullNames} and Bitprop ${dateTimeCreated}.pdf`; // Default or fallback filename format
                break;
        }

        // Only insert metadata for "notarial_lease_template.docx"
        if (templateFileName === "notarial_lease_template.docx") {
            context.log('Preparing metadata for insertion.');
            const metadataBody = {
                PartnershipID: PartnershipID,
                DocumentURL: pdfUrl,
                DocumentType: 'PDF',
                FileName: fileNameFormatted
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
        } else {
            context.log('Metadata insertion skipped for non-notarial lease templates.');
        }

        // Ensure the response is set correctly regardless of whether metadata was inserted
        context.res = { body: { message: "PDF generated, uploaded" + (templateFileName === "notarial_lease_template.docx" ? ", and metadata inserted successfully" : ""), pdfUrl: pdfUrl } };
    } catch (error) {
        context.log(`Error processing the request: ${error}`);
        context.res = { status: 500, body: { message: "Error processing the request", error: error.toString() } };
    }
};

async function generatePDF(context, templateFileName, jsonData) {
    const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
        .withClientId("706671304abe4520b31d650bcf3b09ee")
        .withClientSecret("p8e-MhPcIrM2cvJmOmnlw0eMyK7rpw0gEZ7L")
        .build();

    const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);
    const documentMerge = PDFServicesSdk.DocumentMerge;
    const options = new documentMerge.options.DocumentMergeOptions(jsonData, documentMerge.options.OutputFormat.PDF);
    const documentMergeOperation = documentMerge.Operation.createNew(options);

    const templateFilePath = path.join(__dirname, '..', 'templates', templateFileName);
    const input = PDFServicesSdk.FileRef.createFromLocalFile(templateFilePath);
    documentMergeOperation.setInput(input);

    // Use a temporary file to avoid dependency on a specific directory structure
    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `${templateFileName}_${Date.now()}.pdf`);
    context.log('Saving PDF to temporary path:', outputPath);
    await result.saveAsFile(outputPath);

    const pdfBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath); // Clean up the temporary file
    return pdfBuffer;
}

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