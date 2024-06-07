const PDFServicesSdk = require('@adobe/pdfservices-node-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');

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
            <body>
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
    const tempDir = os.tmpdir();
    const tempHtmlPath = path.join(tempDir, 'tempHtmlFile.html');
    const tempPdfPath = path.join(tempDir, 'result.pdf');

    try {
        const credentials = PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
            .withClientId('706671304abe4520b31d650bcf3b09ee')
            .withClientSecret('p8e-MhPcIrM2cvJmOmnlw0eMyK7rpw0gEZ7L')
            .build();

        const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);

        // Assuming req.body contains DateAgreementStarts, NoMonths, and TotalInvestment
        const { dateAgreementStarts, noMonths, totalInvestment } = req.body;

        if (!dateAgreementStarts || !noMonths || !totalInvestment) {
            context.res = {
                status: 400,
                body: "Please provide dateAgreementStarts, noMonths, and totalInvestment in the request body."
            };
            return;
        }

        // Generate HTML content for the table
        const htmlContent = generateHTMLTable(dateAgreementStarts, noMonths, totalInvestment);

        fs.writeFileSync(tempHtmlPath, htmlContent);

        const htmlFileRef = PDFServicesSdk.FileRef.createFromLocalFile(tempHtmlPath, 'text/html');
        const createPdfOperation = PDFServicesSdk.CreatePDF.Operation.createNew();
        createPdfOperation.setInput(htmlFileRef);

        const result = await createPdfOperation.execute(executionContext);
        await result.saveAsFile(tempPdfPath);

        const pdfBuffer = fs.readFileSync(tempPdfPath);

        context.res = {
            status: 200,
            body: pdfBuffer,
            headers: {
                "Content-Type": "application/pdf"
            }
        };

    } catch (error) {
        console.error('Error during PDF conversion', error);
        context.res = {
            status: 500,
            body: "Internal Server Error: " + error.message
        };
    } finally {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    }
};
