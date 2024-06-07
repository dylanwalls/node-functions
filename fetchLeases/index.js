const sql = require('mssql');

module.exports = async function (context, req) {
  try {
    context.log('Starting fetchLeases function');

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
        L.unitNo,
        L.currentRent,
        L.newRent,
        L.deposit,
        L.statusDesc,
        L.statusDate,
        L.lastPaymentReceived,
        L.tenantName,
        L.tenantMobileNo,
        L.tenantEmail,
        L.tenantIdNo,
        L.leaseId,
        L.firstMonthDate,
        L.rentEscalationDate,
        L.escalationStatus,
        L.tenantResponse,
        L.importTimestamp,
        P.street AS propertyAddress,
        RU.deposit_due AS depositDue,
        RU.status AS depositStatus,
        ROUND(SUM(D.amount), 2) AS depositAmount,
        ROUND(SUM(D.interest), 2) AS interestAmount,
        ROUND(SUM(D.total), 2) AS totalDeposit
      FROM Leases L
      LEFT JOIN RentalUnits RU ON L.unitNo = RU.unit_ref
      LEFT JOIN Properties P ON RU.property_id = P.property_id
      LEFT JOIN Deposits D ON L.unitNo = D.unit_ref AND D.is_active = 1
      GROUP BY L.unitNo, L.currentRent, L.newRent, L.deposit, L.statusDesc, L.statusDate, L.lastPaymentReceived, L.tenantName, L.tenantMobileNo, L.tenantEmail, L.tenantIdNo, L.leaseId, L.firstMonthDate, L.rentEscalationDate, L.escalationStatus, L.tenantResponse, L.importTimestamp, P.street, RU.deposit_due, RU.status
      ORDER BY L.rentEscalationDate;
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
      body: 'Error querying the database for Leases data',
    };
  }
};
