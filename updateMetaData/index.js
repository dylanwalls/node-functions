const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting updateComment function');

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

    // Get the invoice ID and comment from the request body
    const { meta_key, meta_value } = req.body;
    context.log('meta_key', meta_key);
    context.log('meta_value', meta_value);

    context.log('building query 1');
    let query1;
    query1 = `
      MERGE INTO metadata AS target
      USING (SELECT '${meta_key}' AS meta_key, '${meta_value}' AS meta_value) AS source
      ON target.meta_key = source.meta_key
      WHEN MATCHED THEN
          UPDATE SET target.meta_value = source.meta_value, target.updated_at = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN
          INSERT (meta_key, meta_value, created_at, updated_at)
          VALUES (source.meta_key, source.meta_value, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `;

    context.log('Query 1:', query1);
    // Retrieve the existing comments from the database
    const queryResult = await sql.query(query1);
  if (!queryResult) {
      // Handle the case where no records were found
      context.res = {
        status: 500,
        body: 'Error executing the query.',
      };
      return;
    }
    context.log('Query 1 executed:', queryResult);

    // Respond with a success message
    context.res = {
      headers: {
        'Access-Control-Allow-Origin': '*', // This allows requests from any origin during development
        'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS', // Allow only PUT requests for updating comments
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add other allowed headers as needed
      },
      status: 200,
      body: 'Metadata updated successfully',
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: 'Error updating the comment in the database',
    };
  } finally {
    // Close the database connection
    sql.close();
  }
};
