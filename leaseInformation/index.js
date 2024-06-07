const sql = require('mssql');

module.exports = async function (context, req) {
    try {
        context.log('Starting leaseInformation function');

        const config = {
            user: 'dylanwalls',
            password: '950117Dy!',
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
        };

        await sql.connect(config);
        context.log('Connected');
        context.log('REQ BODY: ', req.body);
        
        const request = new sql.Request();
        const inputFields = {
            Name: sql.NVarChar(100),
            Email: sql.NVarChar(100),
            Phone: sql.NVarChar(15),
            IDNumber: sql.NVarChar(20),
            Address: sql.NVarChar(255),
            Flat: sql.NVarChar(50),
            LeaseStartDate: sql.Date,
            Rent: sql.Decimal(10, 2),
            Deposit: sql.Decimal(10, 2),
            CurrentDate: sql.Date
        };

        // Iterate through the fields in the request body and add them to the SQL request
        for (const fieldName in inputFields) {
            const fieldType = inputFields[fieldName];
            const fieldValue = req.body[fieldName] || null; 
            request.input(fieldName, fieldType, fieldValue);
        }

        // Assign the currentDate to the date input
       

        const query = `
            INSERT INTO LeaseInformation (
                ${Object.keys(inputFields).join(', ')}
            ) VALUES (
                ${Object.keys(inputFields).map(fieldName => `@${fieldName}`).join(', ')}
            );
        `;
        context.log('Query:', query);
        await request.query(query);

        context.log('Data inserted');

        context.res = {
            status: 200,
            body: { message: 'Data inserted successfully' },
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        context.log(`Error: ${error.message}\nStack: ${error.stack}`);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error inserting data into the database', details: error.message }),
        };
    } finally {
        sql.close();
    }
};