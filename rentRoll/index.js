const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting Rent Roll function');

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
        Invoices.invoice_id,
        Invoices.unit_ref,
        Properties.chron_order,
        Properties.homeowner, -- Still assuming this is the homeowner column from the 'Properties' table
        Invoices.month,
        Invoices.year,
        Invoices.amount_due,
        Invoices.amount_paid,
        Invoices.date_paid,
        Invoices.transaction_ref,
        RentalUnits.unit_id,
        RentalUnits.deposit_balance,
        RentalUnits.vacant,
        RentalUnits.arrears,
        RentalUnits.agent,
        Invoices.comments
      FROM Invoices
      JOIN Properties ON Invoices.property_id = Properties.property_id
      JOIN RentalUnits ON Invoices.unit_id = RentalUnits.unit_id -- Joining with RentalUnits on unit_id
      WHERE Invoices.invoice_type = 'rent' AND Properties.is_active = 1;
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
      body: 'Error querying the database for Rent Roll data',
    };
  }
};
