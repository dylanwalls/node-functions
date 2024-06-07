const sql = require('mssql');

async function updateLeaseStatus(context, req) {
    try {
        context.log('Starting updateLeaseStatus function');

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

        // Extract leaseId and leaseStatus from the request body
        const { leaseId, leaseStatus } = req.body;

        // Ensure leaseId and leaseStatus are provided
        if (!leaseId || !leaseStatus) {
            context.res = {
                status: 400,
                body: 'leaseId and leaseStatus are required.',
            };
            return;
        }

        // SQL query to update the lease status
        const query = `
            UPDATE Leases
            SET escalationStatus = @leaseStatus
            WHERE leaseId = @leaseId
        `;

        // Prepare and execute the SQL query
        const request = new sql.Request();
        request.input('leaseStatus', sql.VarChar, leaseStatus);
        request.input('leaseId', sql.VarChar, leaseId);
        await request.query(query);

        context.log('Lease status updated successfully.');

        // Send success response
        context.res = {
            status: 200,
            body: 'Lease status updated successfully.',
        };
    } catch (error) {
        context.log.error('Error updating lease status:', error);
        context.res = {
            status: 500,
            body: `Error updating lease status: ${error.message}`,
        };
    } finally {
        // Close the database connection
        await sql.close();
    }
}

module.exports = updateLeaseStatus;
