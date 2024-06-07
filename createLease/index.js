const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { BlobServiceClient, StorageSharedKeyCredential, newPipeline } = require('@azure/storage-blob');
const crypto = require('crypto');

module.exports = async function (context, req) {
  const tempDir = os.tmpdir();
  const tempHtmlPath = path.join(tempDir, 'tempHtmlFile.html');
  const tempPdfPath = path.join(tempDir, 'result.pdf');

  try {
    const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
        .withClientId('706671304abe4520b31d650bcf3b09ee')
        .withClientSecret('p8e-MhPcIrM2cvJmOmnlw0eMyK7rpw0gEZ7L')
        .build();

    const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);
    context.log('Current working directory:', process.cwd());

    // Fetch the HTML template. This might be from a local file, database, or cloud storage
    let htmlTemplatePath = path.join(__dirname, 'lease_template.html');
    let htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');


    // Extract data from request body or database
    const data = req.body;

    // Replace placeholders in the HTML template with actual data
    htmlTemplate = htmlTemplate.replace('{{name}}', data.name);
    htmlTemplate = htmlTemplate.replace('{{email}}', data.email);
    htmlTemplate = htmlTemplate.replace('{{phone}}', data.phone);
    htmlTemplate = htmlTemplate.replace('{{idNumber}}', data.idNumber);
    htmlTemplate = htmlTemplate.replace('{{address}}', data.address);
    htmlTemplate = htmlTemplate.replace('{{flat}}', data.flat);
    htmlTemplate = htmlTemplate.replace('{{leaseStartDate}}', data.leaseStartDate);
    htmlTemplate = htmlTemplate.replace('{{rent}}', data.rent);
    htmlTemplate = htmlTemplate.replace('{{deposit}}', data.deposit);

    fs.writeFileSync(tempHtmlPath, htmlTemplate);

    const htmlFileRef = PDFServicesSdk.FileRef.createFromLocalFile(tempHtmlPath, 'text/html');
    const createPdfOperation = PDFServicesSdk.CreatePDF.Operation.createNew();
    createPdfOperation.setInput(htmlFileRef);

    const result = await createPdfOperation.execute(executionContext);
    await result.saveAsFile(tempPdfPath);

    const pdfBuffer = fs.readFileSync(tempPdfPath);

    // Generate a random string
    const randomString = crypto.randomBytes(4).toString('hex');

    // Azure Storage connection details
    const accountName = 'bitprop';
    const accountKey = 'o8sWbnjZ0AwN9CDtGTHZty9GB5CvjpDcWzR8cApW8r/tB8W4N7qVXn2gssTBy3povwxfUM3zanoa+AStW+vIIQ==';
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const pipeline = newPipeline(sharedKeyCredential);
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, pipeline);

    const containerName = 'homeowner-statements';
    const blobName = 'statement-' + randomString + '.pdf';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    // Upload the PDF file
    await blobClient.uploadFile(tempPdfPath);

    // Generate blob URL with random string
    const blobUrl = `${blobClient.url}?random=${randomString}`;

    context.res = {
        status: 200,
        body: { url: blobUrl }
    };
 

  } catch (error) {
    console.error('Error during PDF conversion', error);
    context.res = {
      status: 500,
      body: "Internal Server Error: " + error.message
    };
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }  
  }
};
