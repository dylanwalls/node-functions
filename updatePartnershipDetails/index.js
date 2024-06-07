const sql = require('mssql');

async function updatePartnershipDetails(context, req) {
    try {
        context.log('Starting updatePartnershipDetails function');

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
        const { partnershipId, erf, address, titleNumber, noUnits, noYears, noMonths, dateAgreementSigned, dateAgreementStarts, totalInvestment, bank, accountHolder, accountNumber, accountType, notesAdditions } = req.body;

        // Ensure all required fields are provided
        if (!partnershipId) {
            context.res = {
                status: 400,
                body: 'Partnership ID and other details are required.',
            };
            return;
        }

        // Start building the SQL query
        let query = `
            UPDATE Partnerships
            SET ERFNumber = @erf, Address = @address, TitleDeedNumber = @titleNumber,
                NoUnits = @noUnits, NoYears = @noYears, NoMonths = @noMonths, 
                TotalInvestment = @totalInvestment, Bank = @bank, 
                AccountHolder = @accountHolder, AccountNumber = @accountNumber, AccountType = @accountType, NotesAdditions = @notesAdditions
        `;

        // Conditional addition for DateAgreementSigned
        if (dateAgreementSigned) {
            query += `, DateAgreementSigned = @dateAgreementSigned`;
        }

        // Conditional addition for DateAgreementStarts
        if (dateAgreementStarts) {
            query += `, DateAgreementStarts = @dateAgreementStarts`;
        }

        // Finish the query
        query += ` WHERE ID = @partnershipId`;

        // Prepare and execute the SQL query
        const request = new sql.Request();
        request.input('partnershipId', sql.Int, partnershipId);
        request.input('erf', sql.VarChar, erf);
        request.input('address', sql.VarChar, address);
        request.input('titleNumber', sql.VarChar, titleNumber);
        request.input('noUnits', sql.Int, noUnits);
        request.input('noYears', sql.VarChar, noYears);
        request.input('noMonths', sql.Int, noMonths);
        if (dateAgreementSigned) request.input('dateAgreementSigned', sql.Date, new Date(dateAgreementSigned));
        if (dateAgreementStarts) request.input('dateAgreementStarts', sql.Date, new Date(dateAgreementStarts));
        request.input('totalInvestment', sql.Money, totalInvestment);
        request.input('bank', sql.VarChar, bank);
        request.input('accountHolder', sql.VarChar, accountHolder);
        request.input('accountNumber', sql.VarChar, accountNumber);
        request.input('accountType', sql.VarChar, accountType);
        request.input('notesAdditions', sql.VarChar, notesAdditions);
        await request.query(query);

        context.log('Partnership details updated successfully.');

        // Send success response
        context.res = {
            status: 200,
            body: 'Partnership details updated successfully.',
        };
    } catch (error) {
        context.log.error('Error updating partnership details:', error);
        context.res = {
            status: 500,
            body: `Error updating partnership details: ${error.message}`,
        };
    } finally {
        // Close the database connection
        await sql.close();
    }
}

module.exports = updatePartnershipDetails;