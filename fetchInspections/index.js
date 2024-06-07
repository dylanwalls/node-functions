const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting fetchInspections function');

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
    
    // Extended query to fetch additional data
    const query = `
      SELECT
        I.id,
        I.lease_id,
        I.escalationDate,
        I.completed,
        I.prefilled_inspection_form,
        I.submitted_inspection_form_url,
        I.inspection_form_data,
        I.prefilled_maintenance_quotes_form,
        I.submitted_maintenance_quotes_url,
        I.maintenance_quotes_data,
        L.tenantName,
        L.tenantMobileNo,
        L.rentEscalationDate,
        L.unitNo,
        P.street,
        P.suburb
      FROM inspections I
      JOIN Leases L ON I.lease_id = L.id
      JOIN Properties P ON L.buildingName = P.property_ref;
    `;

    // Execute the extended query
    const queryResult = await sql.query(query);

    // Extract the data from the query result
    const data = queryResult.recordset;
    context.log('Data obtained', data);
    
    // Send the data as the HTTP response
    context.res = {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 200,
      body: data,
    };
  } catch (error) {
    context.log.error('Error querying the database:', error);
    context.res = {
      status: 500,
      body: 'Error querying the database for Inspections data',
    };
  }
};
