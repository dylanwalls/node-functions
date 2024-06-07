const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting unitDeposits function');

    // Your database connection configuration
    const config = {
      user: 'dylanwalls',
      password: '950117Dy!',
      server: 'scorecard-server.database.windows.net',
      database: 'dashboard-new-server',
    };

    // Extract the unitRef from the request body
    const unitRef = req.body.unitRef;

    // Connect to the database
    await sql.connect(config);
    context.log('Connected');
    context.log(unitRef);

    // Create a request object
    const request = new sql.Request();

    // Query the database to retrieve data for the Rent Roll
    request.input('unitRef', sql.VarChar, unitRef); // Define the parameter

    // Define the SQL query with the parameter
    const queryText = `
      SELECT
        * FROM Deposits
      WHERE
        unit_ref = @unitRef
    `;

    // Log the SQL query
    context.log('SQL Query:', queryText);

    // Execute the query
    const queryResult = await request.query(queryText);

    // Extract the data from the query result
    const data = queryResult.recordset;
    context.log('Data obtained');
    context.log(data);
    
    // Send the Rent Roll data as the HTTP response
    context.res = {
      headers: {
        'Access-Control-Allow-Origin': '*', // This allows requests from any origin during development
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Add other allowed HTTP methods as needed
        'Access-Control-Allow-Headers': 'Content-Type, application/json', // Add other allowed headers as needed
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
