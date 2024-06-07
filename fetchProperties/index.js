const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting fetchProperties function');

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
        Properties.property_id,
        Properties.property_ref,
        Properties.homeowner,
        Properties.street,
        Properties.suburb,
        Properties.no_units,
        Properties.rent,
        Properties.manual_comments,
        Properties.citiq_elec,
        Properties.citiq_water,
        Properties.phone,
        Properties.latest_homeowner_total,
        Properties.chron_order
      FROM Properties
      ORDER BY Properties.chron_order;
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
      body: 'Error querying the database for Properties data',
    };
  }
};