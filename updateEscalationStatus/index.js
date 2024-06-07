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
    const { tableName, recordId, comment } = req.body;
    context.log('tableName', tableName);
    context.log('recordId', recordId);
    context.log('comment', comment);

    // Check if the invoiceId and comment are provided
    if (!tableName || !recordId || comment === undefined) {
      context.res = {
        status: 400,
        body: 'tableName, recordID, and comment are required in the request body.',
      };
      return;
    }
    context.log('building query 1');
    let query1;
    if (tableName === 'rentalUnits') {
      query1 = `SELECT comments FROM ${tableName} WHERE unit_id = ${recordId}`;
    } else {
      query1 = `SELECT comments FROM ${tableName} WHERE ${tableName.toLowerCase().slice(0, -1)}_id = ${recordId}`;
    }
    context.log('Query 1:', query1);
    // Retrieve the existing comments from the database
    const queryResult = await sql.query(query1);
    if (queryResult.recordset.length === 0) {
      // Handle the case where no records were found
      context.res = {
        status: 404,
        body: 'Record not found in the database.',
      };
      return;
    }
    context.log('Query 1 executed:', queryResult);
  
    // Extract the existing comments
    const existingComments = queryResult.recordset[0].comments || '';

    // Concatenate the existing comments and the new comment with a newline separator
    const updatedComments = existingComments ? `${existingComments}\n${comment}` : comment;
    context.log('updatedComments:', updatedComments);
    // Update the comment in the database
    context.log('building query 2');
    let query2;
    if (tableName == 'rentalUnits') {
      query2 = `UPDATE ${tableName} SET comments = '${updatedComments}' WHERE unit_id = ${recordId}`
    } else {
      query2 = `UPDATE ${tableName} SET comments = '${updatedComments}' WHERE ${tableName.toLowerCase().slice(0, -1)}_id = ${recordId}`
    }
    context.log('Query 2:', query2);
    await sql.query(query2);

    context.log('Comment updated in the database');

    // Respond with a success message
    context.res = {
      headers: {
        'Access-Control-Allow-Origin': '*', // This allows requests from any origin during development
        'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS', // Allow only PUT requests for updating comments
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add other allowed headers as needed
      },
      status: 200,
      body: 'Comment updated successfully',
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
