const sql = require('mssql');

module.exports = async function (context, req) {
    try {
        context.log('Starting fetchLatestHomeownerInvoices function');

        const propertyId = req.body.propertyId;

        const config = {
            user: 'dylanwalls',
            password: '950117Dy!', // Consider using environment variables for sensitive data
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
        };

        await sql.connect(config);
        context.log('Connected to the database');

        const query = `
            SELECT
                Invoices.invoice_id,
                Invoices.property_id,
                Invoices.unit_id,
                Invoices.unit_ref,
                Invoices.month,
                Invoices.year,
                Invoices.amount_due,
                Invoices.amount_paid,
                Invoices.date_paid,
                Invoices.transaction_ref,
                Invoices.payout_status,
                Invoices.payout_date,
                Invoices.amount_paid_out,
                Invoices.comments
            FROM Invoices
            WHERE Invoices.property_id = @propertyId
            AND invoice_type = 'rent'
            AND (payout_status = 'Unpaid' OR payout_status = 'Partially Paid');
        `;

        const request = new sql.Request();
        request.input('propertyId', sql.Int, propertyId);

        const queryResult = await request.query(query);
        let invoices = queryResult.recordset;

        for (let invoice of invoices) {
            if (invoice.payout_status === 'Partially Paid') {
                context.log('Running partially paid scenario');
                // Additional query to sum amounts for 'Partially Paid' invoices
                const paymentQuery = `
                    SELECT SUM(amount) AS unpaidAmount
                    FROM InvoicePayments
                    WHERE invoice_id = @invoiceId
                    AND included_in_payout = 0;
                `;

                const paymentRequest = new sql.Request();
                paymentRequest.input('invoiceId', sql.Int, invoice.invoice_id);

                const paymentResult = await paymentRequest.query(paymentQuery);
                if (paymentResult.recordset.length > 0) {
                    const unpaidAmount = paymentResult.recordset[0].unpaidAmount || 0;
                    invoice.amount_paid = unpaidAmount; // Update amount_paid with the sum of unpaid amounts
                }
            }
        }
        
        context.log('Invoices:', invoices);

        context.res = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            status: 200,
            body: invoices, // Return the updated list of invoices
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: 'Error querying the database for homeowner invoices data',
        };
        context.log('Error:', error);
    }
};




// // const sql = require('mssql');

// // module.exports = async function (context, req) {
// //     try {
// //         context.log('Starting fetchLatestHomeownerInvoices function');

// //         // Extract propertyId and month from the request body if it's sent as JSON
// //         const propertyId = req.body.propertyId;

// //         // Your database connection configuration
// //         const config = {
// //             user: 'dylanwalls',
// //             password: '950117Dy!',
// //             server: 'scorecard-server.database.windows.net',
// //             database: 'dashboard-new-server',
// //         };

// //         // Connect to the database
// //         await sql.connect(config);
// //         context.log('Connected');

// //         // Query to fetch latest homeowner invoices based on propertyId and month
// //         const query = `
// //             SELECT
// //                 Invoices.invoice_id,
// //                 Invoices.property_id,
// //                 Invoices.unit_id,
// //                 Invoices.unit_ref,
// //                 Invoices.month,
// //                 Invoices.year,
// //                 Invoices.amount_due,
// //                 Invoices.amount_paid,
// //                 Invoices.date_paid,
// //                 Invoices.transaction_ref,
// //                 Invoices.payout_status,
// //                 Invoices.payout_date,
// //                 Invoices.amount_paid_out,
// //                 Invoices.comments
// //             FROM Invoices
// //             WHERE Invoices.property_id = @propertyId
// //             AND invoice_type = 'rent'
// //             AND (payout_status = 'Unpaid' OR payout_status = 'Partially Paid');
// //         `;

// //         const request = new sql.Request();
// //         request.input('propertyId', sql.Int, propertyId); // Assuming propertyId is an integer

// //         // Execute the query with the provided propertyId and month
// //         const queryResult = await request.query(query);

// //         // Extract the data from the query result
// //         const data = queryResult.recordset;
// //         context.log('Data obtained');
// //         context.log(data);

// //         // Send the data as the HTTP response
// //         context.res = {
// //             headers: {
// //                 'Access-Control-Allow-Origin': '*', // This allows requests from any origin
// //                 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
// //                 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// //             },
// //             status: 200,
// //             body: data,
// //         };
// //     } catch (error) {
// //         context.res = {
// //             status: 500,
// //             body: 'Error querying the database for homeowner invoices data',
// //         };
// //         context.log('Error:', error);
// //     }
// // };



// const sql = require('mssql');

// module.exports = async function (context, req) {
//     try {
//         context.log('Starting fetchLatestHomeownerInvoices function');

//         // Extract propertyId from the request body if it's sent as JSON
//         const propertyId = req.body.propertyId;

//         // Your database connection configuration
//         const config = {
//             user: 'dylanwalls',
//             password: '950117Dy!', // Consider using environment variables for sensitive data
//             server: 'scorecard-server.database.windows.net',
//             database: 'dashboard-new-server',
//         };

//         // Connect to the database
//         await sql.connect(config);
//         context.log('Connected');

//         // Query to fetch latest homeowner invoices based on propertyId
//         const query = `
//             SELECT
//                 Invoices.invoice_id,
//                 Invoices.property_id,
//                 Invoices.unit_id,
//                 Invoices.unit_ref,
//                 Invoices.month,
//                 Invoices.year,
//                 Invoices.amount_due,
//                 Invoices.amount_paid,
//                 Invoices.date_paid,
//                 Invoices.transaction_ref,
//                 Invoices.payout_status,
//                 Invoices.payout_date,
//                 Invoices.amount_paid_out,
//                 Invoices.comments
//             FROM Invoices
//             WHERE Invoices.property_id = @propertyId
//             AND invoice_type = 'rent'
//             AND (payout_status = 'Unpaid' OR payout_status = 'Partially Paid');
//         `;

//         const request = new sql.Request();
//         request.input('propertyId', sql.Int, propertyId);

//         // Execute the query with the provided propertyId
//         const queryResult = await request.query(query);
//         const invoices = queryResult.recordset;
//         context.log('Invoices obtained:', invoices);

//         // Calculate the total to homeowner
//         let totalToHomeowner = invoices.reduce((acc, invoice) => {
//             const amountPaid = parseFloat(invoice.amount_paid);
//             let homeownerAmount;
//             if (propertyId === '151') {
//                 homeownerAmount = 0.175 * amountPaid;
//             } else if (propertyId === '137') {
//                 homeownerAmount = 0.35 * amountPaid;
//             } else {
//                 homeownerAmount = 0.15 * amountPaid;
//             }
//             return acc + homeownerAmount;
//         }, 0);

//         // Update the Properties table with the calculated total
//         const updateQuery = `
//             UPDATE Properties
//             SET latest_homeowner_total = @totalToHomeowner
//             WHERE property_id = @propertyId;
//         `;
//         const updateRequest = new sql.Request();
//         updateRequest.input('totalToHomeowner', sql.Decimal(18, 2), totalToHomeowner); // Ensure the precision and scale match your column definition
//         updateRequest.input('propertyId', sql.Int, propertyId);

//         // Execute the update query
//         await updateRequest.query(updateQuery);
//         context.log(`Properties.latest_homeowner_total updated for propertyId ${propertyId} with total ${totalToHomeowner}`);

//         // Send the invoices data as the HTTP response
//         context.res = {
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//                 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//                 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//             },
//             status: 200,
//             body: invoices,
//         };
//     } catch (error) {
//         context.res = {
//             status: 500,
//             body: 'Error querying the database for homeowner invoices data or updating homeowner total',
//         };
//         context.log('Error:', error);
//     }
// };
