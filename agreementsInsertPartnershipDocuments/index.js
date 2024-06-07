const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting to insert document metadata');

    // Your Azure SQL Database connection configuration
    const config = {
      user: 'dylanwalls',
      password: '950117Dy!',
      server: 'scorecard-server.database.windows.net',
      database: 'dashboard-new-server',
    };

    // Connect to the database
    await sql.connect(config);
    context.log('Connected to SQL Database');

    // Extract data from request body
    const { PartnershipID, DocumentURL, DocumentType, FileName } = req.body;

    // Create a new request for the current connection
    let request = new sql.Request();

    // Add parameters to the request
    request.input('PartnershipID', sql.Int, PartnershipID);
    request.input('DocumentURL', sql.VarChar, DocumentURL);
    request.input('DocumentType', sql.VarChar, DocumentType);
    request.input('FileName', sql.VarChar, FileName);

    // Define the SQL query
    const query = `
      INSERT INTO PartnershipDocuments (PartnershipID, DocumentURL, DocumentType, FileName)
      VALUES (@PartnershipID, @DocumentURL, @DocumentType, @FileName);
    `;

    // Execute the query
    await request.query(query);

    context.log('Document metadata inserted successfully.');

    // Send a success response
    context.res = {
      status: 200,
      body: "Document metadata inserted successfully."
    };
  } catch (error) {
    context.log.error('Error inserting document metadata:', error);
    context.res = {
      status: 500,
      body: `Error inserting document metadata: ${error.message}`
    };
  } finally {
    // Close the database connection
    sql.close();
  }
};
