const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async function (context, req) {
  // Define tempHtmlPath in a scope accessible by both try and catch blocks
  const tempDir = os.tmpdir();
  const tempHtmlPath = path.join(tempDir, 'tempHtmlFile.html');
  const tempPdfPath = path.join(tempDir, 'result.pdf');
    try {
        // // Setup Adobe PDF Services API credentials
        // const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
        //   .withClientId('5b7842a8bce4434eb512ca8f089eaac5')
        //   .withClientSecret('p8e-omiTgSFCuKcM4a_SDScK29aV7TwPyNj8')
        //   .build();
        // Setup Adobe PDF Services API credentials
        const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
        .withClientId('706671304abe4520b31d650bcf3b09ee')
        .withClientSecret('p8e-MhPcIrM2cvJmOmnlw0eMyK7rpw0gEZ7L')
        .build();

        const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);

        // Get HTML content from the HTTP request body
        const htmlContent = req.body && req.body.htmlContent;

        if (!htmlContent) {
            context.res = {
                status: 400,
                body: "Please provide HTML content in the request body."
            };
            return;
        }

        fs.writeFileSync(tempHtmlPath, htmlContent);

        // Create a FileRef instance from the temporary HTML file
        const htmlFileRef = PDFServicesSdk.FileRef.createFromLocalFile(tempHtmlPath, 'text/html');

        // Create a new PDF creation operation
        const createPdfOperation = PDFServicesSdk.CreatePDF.Operation.createNew();

        // Set operation input from the source HTML file
        createPdfOperation.setInput(htmlFileRef);

        // Execute the operation and Save the result to the specified location
        const result = await createPdfOperation.execute(executionContext);
        await result.saveAsFile(tempPdfPath);

        // Get the PDF as a buffer
        const pdfBuffer = fs.readFileSync(tempPdfPath);

        // Set the HTTP response
        context.res = {
            status: 200,
            body: pdfBuffer,
            headers: {
                "Content-Type": "application/pdf"
            }
        };

        // Clean up the temporary file
        fs.unlinkSync(tempHtmlPath);
        fs.unlinkSync(tempPdfPath);

    } catch (error) {
        console.error('Error during PDF conversion', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + error.message
        };
      } finally {
        // Clean up the temporary file in case of an error
        if (fs.existsSync(tempHtmlPath)) {
            fs.unlinkSync(tempHtmlPath);
        }
        if (fs.existsSync(tempPdfPath)) {
          fs.unlinkSync(tempPdfPath);
        }  
    }
};
