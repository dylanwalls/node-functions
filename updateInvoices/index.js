const sql = require('mssql');

async function updateInvoicePayoutStatus(context, req) {
    try {
        context.log('Starting updateInvoicePayoutStatus function');

        // Database connection configuration
        const config = {
            user: 'dylanwalls',
            password: '950117Dy!',
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
            // Add the options property to enable multiple statements if it's supported and needed
            options: {
                encrypt: true, // For Azure SQL, set encrypt to true
                enableArithAbort: true
            }
        };

        // Connect to the database
        await sql.connect(config);
        context.log('Connected to SQL Server');

        // Extract invoiceIds from the request body
        const { invoiceIds } = req.body;

        // Ensure invoiceIds is provided and is an array
        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            context.res = {
                status: 400,
                body: 'invoiceIds is required and must be an array.',
            };
            return;
        }

        // SQL query to update the payout status and date for each invoice
        const query = invoiceIds.map(invoiceId => 
            `UPDATE Invoices SET payout_status = 'Paid', payout_date = GETDATE() WHERE invoice_id = '${invoiceId}';`
        ).join(' ');

        // Prepare and execute the SQL query
        await sql.query(query);

        context.log('Invoice payout statuses updated successfully.');

        // Send success response
        context.res = {
            status: 200, // Or any other appropriate status code
            body: JSON.stringify({ message: 'Invoice payout statuses updated successfully.' }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        context.log.error('Error updating invoice payout statuses:', error);
        context.res = {
            status: 500,
            body: JSON.stringify({ message: `Error updating invoice payout statuses: ${error.message}` }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } finally {
        // Close the database connection
        await sql.close();
    }
}

module.exports = updateInvoicePayoutStatus;
