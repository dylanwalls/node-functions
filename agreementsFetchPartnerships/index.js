const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting agreementsFetchLeases function');

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
    // Query the database to retrieve data for the Rent Roll
    const queryResult = await sql.query(`
    SELECT 
        p.*,
        STRING_AGG(CONCAT(pr.Name, '|', pr.Surname, '|', pr.IDNumber, '|', pr.Email, '|', pr.ContactNumber), ';;') AS PartnerDetails
    FROM Partnerships p
    JOIN Partners pr ON p.ID = pr.PartnershipID
    GROUP BY p.ID, p.ERFNumber, p.Address, p.TitleDeedNumber, p.NoUnits, p.NoYears, p.NoMonths, p.DateAgreementSigned, p.DateAgreementStarts, p.TotalInvestment, p.Bank, p.AccountHolder, p.AccountNumber, p.AccountType, p.NotesAdditions
    `);

    // Extract the data from the query result
    const data = queryResult.recordset;
    context.log('Data obtained');
    context.log(data);
    // Send the Rent Roll data as the HTTP response
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
      body: 'Error querying the database for Leases data',
    };
  }
};