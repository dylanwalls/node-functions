const sql = require('mssql');

async function updatePartnerDetails(context, req) {
    try {
        context.log('Starting updatePartnerDetails function');

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

        // Extract details from the request body
        const { partnerId, name, surname, idNumber, email, contactNumber, partnershipId } = req.body;
        context.log('req body:', req.body);
        // Ensure all required fields are provided
        if (!partnerId) {
            context.res = {
                status: 400,
                body: 'Partner ID and other details are required.',
            };
            return;
        }

        // SQL query to update the partner details
        const query = `
            UPDATE Partners
            SET Name = @name, Surname = @surname, IDNumber = @idNumber, 
                Email = @email, ContactNumber = @contactNumber, PartnershipID = @partnershipId
            WHERE ID = @partnerId
        `;

        // Prepare and execute the SQL query
        const request = new sql.Request();
        request.input('partnerId', sql.Int, partnerId);
        request.input('name', sql.NVarChar, name);
        request.input('surname', sql.NVarChar, surname);
        request.input('idNumber', sql.NVarChar, idNumber);
        request.input('email', sql.NVarChar, email);
        request.input('contactNumber', sql.NVarChar, contactNumber);
        request.input('partnershipId', sql.Int, partnershipId); // Optional: only if you need to update this relation
        context.log('Query:', query);
        await request.query(query);

        context.log('Partner details updated successfully.');

        // Send success response
        context.res = {
            status: 200,
            body: 'Partner details updated successfully.',
        };
    } catch (error) {
        context.log.error('Error updating partner details:', error);
        context.res = {
            status: 500,
            body: `Error updating partner details: ${error.message}`,
        };
    } finally {
        // Close the database connection
        await sql.close();
    }
}

module.exports = updatePartnerDetails;
