const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting fetchCitiqPayouts function');

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
          p.property_ref AS Property,
          rm.monthYear AS Month,
          SUM(CASE WHEN rm.UoM = 'kWh' THEN rm.amount ELSE 0 END) AS Electricity,
          SUM(CASE WHEN rm.UoM = 'kL' THEN rm.amount ELSE 0 END) AS Water
      FROM 
          remitMeter rm
      INNER JOIN 
          citiqMeters cm ON rm.Meter = cm.Meter
      INNER JOIN 
          Properties p ON cm.property_id = p.property_id
      GROUP BY 
          p.property_ref,
          rm.monthYear
      ORDER BY 
          rm.monthYear,
          p.property_ref
      ;
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
      body: 'Error querying the database for Citiq Payouts data',
    };
  }
};