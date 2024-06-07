const sql = require('mssql');

async function addPartnershipAndPartners(context, req) {
    try {
        // Move your Azure SQL Database connection configuration inside the try block
        const config = {
            user: 'dylanwalls',
            password: '950117Dy!',
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
        };

        await sql.connect(config);
        context.log('Connection successful.');

        const transaction = new sql.Transaction();
        await transaction.begin();
        context.log('Transaction begun.');

        // Insert into Partnerships table
        let partnershipQuery = `INSERT INTO Partnerships (ERFNumber, Address, TitleDeedNumber, NoUnits, NoYears, NoMonths, DateAgreementSigned, TotalInvestment, Bank, AccountHolder, AccountNumber, AccountType) OUTPUT INSERTED.ID VALUES (@ERFNumber, @Address, @TitleDeedNumber, @NoUnits, @NoYears, @NoMonths, @DateAgreementSigned, @TotalInvestment, @Bank, @AccountHolder, @AccountNumber, @AccountType);`;
        context.log('Preparing to insert into Partnerships...');
        
        let partnershipResult = await transaction.request()
            .input('ERFNumber', sql.NVarChar, req.body.erf)
            .input('Address', sql.NVarChar, req.body.address)
            .input('TitleDeedNumber', sql.NVarChar, req.body.titleNumber)
            .input('NoUnits', sql.Int, req.body.noUnits)
            .input('NoYears', sql.NVarChar, req.body.noYears)
            .input('NoMonths', sql.Int, req.body.noMonths)
            .input('DateAgreementSigned', sql.Date, req.body.dateAgreementSigned)
            .input('TotalInvestment', sql.Float, req.body.totalInvestment)
            .input('Bank', sql.NVarChar, req.body.bank)
            .input('AccountHolder', sql.NVarChar, req.body.accountHolder)
            .input('AccountNumber', sql.NVarChar, req.body.accountNumber)
            .input('AccountType', sql.NVarChar, req.body.accountType)
            .query(partnershipQuery);
        context.log('Insert into Partnerships successful.');

        const partnershipID = partnershipResult.recordset[0].ID;
        context.log(`Partnership ID: ${partnershipID}`);

        // Assuming `req.body.partners` is an array of partner objects
        for (const partner of req.body.partners) {
            context.log(`Inserting partner: ${partner.name} ${partner.surname}`);
            let partnersQuery = `INSERT INTO Partners (PartnershipID, Name, Surname, IDNumber, Email, ContactNumber) VALUES (@PartnershipID, @Name, @Surname, @IDNumber, @Email, @ContactNumber);`;
            await transaction.request()
                .input('PartnershipID', sql.Int, partnershipID)
                .input('Name', sql.NVarChar, partner.name)
                .input('Surname', sql.NVarChar, partner.surname)
                .input('IDNumber', sql.NVarChar, partner.idNumber)
                .input('Email', sql.NVarChar, partner.email)
                .input('ContactNumber', sql.NVarChar, partner.contactNumber)
                .query(partnersQuery);
            context.log(`Partner ${partner.name} ${partner.surname} inserted successfully.`);
        }

        await transaction.commit();
        context.log('Transaction committed successfully.');

        // Setting Content-Type header explicitly (usually not necessary)
        context.res = {
            status: 200,
            body: JSON.stringify({ message: "Partnership and partners added successfully.", partnershipID: partnershipID }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (err) {
        context.log(`Error: ${err.message}`);
        context.res = {
            status: 500,
            body: JSON.stringify({ message: `Error adding partnership and partners: ${err.message}` }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } finally {
        await sql.close();
        context.log('SQL connection closed.');
    }
}

module.exports = addPartnershipAndPartners;
