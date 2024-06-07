const sql = require('mssql');

module.exports = async function (context, req) {
    try {
        context.log('Starting agreementsFetchPartnershipDocuments function');

        // Extract PartnershipID from query parameters
        const partnershipId = req.query.partnershipId || (req.body && req.body.partnershipId);

        // Your database connection configuration
        const config = {
            user: 'dylanwalls',
            password: '950117Dy!',
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
        };

        // Connect to the database
        await sql.connect(config);
        context.log('Connected to SQL Database');

        // Query to fetch documents linked to a specific PartnershipID
        const query = `
            SELECT
                DocumentID,
                PartnershipID,
                DocumentURL,
                DocumentType,
                FileName,
                CreatedDate
            FROM ActivePartnershipDocuments
            WHERE PartnershipID = @PartnershipID;
        `;

        const request = new sql.Request();
        request.input('PartnershipID', sql.Int, partnershipId); // Assuming PartnershipID is an integer

        // Execute the query with the provided PartnershipID
        const queryResult = await request.query(query);

        // Extract the data from the query result
        const data = queryResult.recordset;
        context.log('Partnership Documents Data Obtained');
        context.log(data);

        // Send the data as the HTTP response
        context.res = {
            headers: {
                'Access-Control-Allow-Origin': '*', // This allows requests from any origin during development
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Add other allowed HTTP methods as needed
                'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add other allowed headers as needed
            },
            status: 200,
            body: data,
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `Error querying the database for PartnershipDocuments data: ${error.message}`,
        };
        context.log.error('Error querying the database:', error);
    }
};
