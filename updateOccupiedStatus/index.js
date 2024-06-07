const sql = require('mssql');

async function updateOccupiedStatus(context, req) {
    try {
        context.log('Starting updateOccupiedStatus function');

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
        const { unit_id, vacant } = req.body;

        // Ensure leaseId and leaseStatus are provided
        if (unit_id === undefined || vacant === undefined) {
            context.res = {
                status: 400,
                body: 'unit_id and arrears are required.',
            };
            return;
        }

        // Start building the SQL query
        let query = `
            UPDATE RentalUnits
            SET vacant = @vacant
            WHERE unit_id = @unit_id
        `;

        // Prepare the SQL query
        const request = new sql.Request();
        request.input('vacant', sql.Int, vacant);
        request.input('unit_id', sql.Int, unit_id);
        
        context.log('Query:', query);

        // Execute the SQL query
        await request.query(query);

        context.log('Occupied status updated successfully.');

        // Send success response
        context.res = {
            status: 200,
            body: 'Occupied status updated successfully.',
        };
    } catch (error) {
        context.log.error('Error updating occupied status:', error);
        context.res = {
            status: 500,
            body: `Error updating occupied status: ${error.message}`,
        };
    } finally {
        // Close the database connection
        await sql.close();
    }
}

module.exports = updateOccupiedStatus;
