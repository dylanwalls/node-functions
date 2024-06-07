const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const { BlobServiceClient } = require('@azure/storage-blob');
let fetch;

async function loadDependencies() {
    if (!fetch) {
        fetch = (await import('node-fetch')).default;
    }
}

const path = require('path');
const fs = require('fs');
const os = require('os');

// Assuming these are correctly set in your application's environment variables
const AZURE_STORAGE_CONNECTION_STRING = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const containerName = 'homeowner-statements';
const metadataFunctionUrl = "https://dashboard-function-app-1.azurewebsites.net/api/agreementsInsertPartnershipDocuments?code=mDE4b49vv31u8tpbeNE9Q_6-aVEvPrLuxOwWkmZtcKIFAzFu2EpjPA==";

function generateHTMLTable(dateAgreementStarts, noMonths, totalInvestment) {
    let currentDate = new Date(dateAgreementStarts);
    const monthlyAmount = totalInvestment / noMonths;
    let tableRows = '';

    for (let i = 0; i < noMonths; i++) {
        const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        tableRows += `<tr><td>${monthYear}</td><td>${monthlyAmount.toFixed(2)}</td></tr>`;
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return `
        <html>
            <head>
                <title>Payment Schedule</title>
            </head>
            <body>
                <h2>Payment Schedule</h2>
                <table border="1">
                    <tr>
                        <th>Month</th>
                        <th>Amount</th>
                    </tr>
                    ${tableRows}
                </table>
            </body>
        </html>
    `;
}

module.exports = async function (context, req) {
    await loadDependencies(); // Make sure dependencies are loaded
    context.log('Starting PDF generation and upload process.');

    // Define the paths outside the try block to ensure they're accessible in the finally block for cleanup
    const tempDir = os.tmpdir();
    const tempHtmlFileName = `tempHtmlFile_${Date.now()}.html`; // Unique filename to avoid conflicts
    const tempPdfFileName = `result_${Date.now()}.pdf`; // Unique filename to avoid conflicts
    const tempHtmlPath = path.join(tempDir, tempHtmlFileName);
    const tempPdfPath = path.join(tempDir, tempPdfFileName);

    const { dateAgreementStarts, noMonths, totalInvestment, PartnershipID } = req.body;

    if (!dateAgreementStarts || !noMonths || !totalInvestment || !PartnershipID) {
        context.res = { status: 400, body: "Missing required fields in the request body." };
        return;
    }

    try {
        const htmlContent = generateHTMLTable(dateAgreementStarts, noMonths, totalInvestment);

        fs.writeFileSync(tempHtmlPath, htmlContent);

        const htmlToPdfOperation = PDFServicesSdk.CreatePDF.Operation.createNew();
        const htmlFileRef = PDFServicesSdk.FileRef.createFromLocalFile(tempHtmlPath, 'text/html');
        htmlToPdfOperation.setInput(htmlFileRef);

        const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
            .withClientId('706671304abe4520b31d650bcf3b09ee')
            .withClientSecret('p8e-MhPcIrM2cvJmOmnlw0eMyK7rpw0gEZ7L')
            .build();
        
        const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);
        const result = await htmlToPdfOperation.execute(executionContext);
        await result.saveAsFile(tempPdfPath);

        // Log the local PDF file path immediately after generation
        context.log(`PDF generated successfully. Local path: ${tempPdfPath}`);

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(path.basename(tempPdfPath));

        await blockBlobClient.uploadFile(tempPdfPath, {
            blobHTTPHeaders: { blobContentType: "application/pdf" }
        });

        const pdfUrl = blockBlobClient.url;
        context.log(`PDF uploaded successfully. Blob URL: ${pdfUrl}`);

        // Get the current date and time
        const now = new Date();

        // Convert current date and time to UTC+2
        const utcOffsetInHours = 2;
        const utcPlusTwoTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + (utcOffsetInHours * 60 * 60000));

        // Format the date and time
        const dateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
        const dateTimeCreated = utcPlusTwoTime.toLocaleString('en-GB', dateTimeFormatOptions).replace(/\//g, '-').replace(',', '');

        // // Insert metadata via agreementsInsertPartnershipDocuments
        // const metadataResponse = await fetch(metadataFunctionUrl, {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         PartnershipID,
        //         DocumentURL: pdfUrl,
        //         DocumentType: "PDF",
        //         FileName: `Repayment Schedule ${dateTimeCreated}.pdf`
        //     }),
        //     headers: { 'Content-Type': 'application/json' }
        // });

        // if (!metadataResponse.ok) {
        //     throw new Error('Failed to insert document metadata');
        // }

        context.res = {
            body: { message: "PDF generated, uploaded, and metadata inserted successfully.", pdfUrl }
        };
    } catch (error) {
        context.log(`Error processing the request: ${error}`);
        context.res = { status: 500, body: `Error processing the request: ${error.message}` };
    } finally {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    }
};

