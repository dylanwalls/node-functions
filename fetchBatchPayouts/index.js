const sql = require('mssql');

module.exports = async function (context, req) {
    try {
        context.log('Starting fetchBatchPayouts function');

        // Extract property_id from query parameters
        const propertyId = req.query.property_id;

        // Your database connection configuration
        const config = {
            user: 'dylanwalls',
            password: '950117Dy!',
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
        };

        // Connect to the database
        await sql.connect(config);
        context.log('Connected');

        // Adjusted query to filter based on property_id
        const query = `
            SELECT
                PayoutBatches.payout_batch_id,
                PayoutBatches.payout_name,
                PayoutBatches.status,
                PayoutBatches.payout_date
            FROM PayoutBatches;
        `;

        const request = new sql.Request();
        request.input('propertyId', sql.Int, propertyId); // Assuming property_id is an integer

        // Execute the query with the provided propertyId
        const queryResult = await request.query(query);

        // Extract the data from the query result
        const data = queryResult.recordset;
        context.log('Data obtained');
        context.log(data);

        // Send the data as the HTTP response
        context.res = {
            headers: {
                'Access-Control-Allow-Origin': '*', // This allows requests from any origin
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            status: 200,
            body: data,
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: 'Error querying the database for BatchPayouts data',
        };
        context.log('Error:', error);
    }
};
