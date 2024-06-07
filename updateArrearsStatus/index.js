const sql = require('mssql');

async function updateArrearsStatus(context, req) {
    try {
        context.log('Starting updateArrearsStatus function');

        // Database connection configuration
        const config = {
            user: 'dylanwalls',
            password: '950117Dy!',
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
        };

        // Connect to the database
        await sql.connect(config);
        context.log('Connected to SQL Server');

        context.log('req.body:', req.body);

        // Extract leaseId, leaseStatus, and potentially newRentAmount from the request body
        const { unit_id, arrears } = req.body;

        // Ensure leaseId and leaseStatus are provided
        if (unit_id === undefined || arrears === undefined) {
            context.res = {
                status: 400,
                body: 'unit_id and arrears are required.',
            };
            return;
        }

        // Start building the SQL query
        let query = `
            UPDATE RentalUnits
            SET arrears = @arrears
            WHERE unit_id = @unit_id
        `;

        // Prepare the SQL query
        const request = new sql.Request();
        request.input('arrears', sql.Int, arrears);
        request.input('unit_id', sql.Int, unit_id);
        
        context.log('Query:', query);

        // Execute the SQL query
        await request.query(query);

        context.log('Arrears status updated successfully.');

        // Send success response
        context.res = {
            status: 200,
            body: 'Arrears status updated successfully.',
        };
    } catch (error) {
        context.log.error('Error updating arrears status:', error);
        context.res = {
            status: 500,
            body: `Error updating arrears status: ${error.message}`,
        };
    } finally {
        // Close the database connection
        await sql.close();
    }
}

module.exports = updateArrearsStatus;
