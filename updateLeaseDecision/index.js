let fetch;
import('node-fetch').then(module => {
    fetch = module.default;
});
const querystring = require('querystring');
const sql = require('mssql'); // Ensure 'mssql' package is installed
const { inspect } = require('util');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let ticket_id, label_id, lease_id;

    // Determine content type and parse data accordingly
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        const formData = querystring.parse(req.body);
        ticket_id = formData.ticket_id;
        label_id = formData.label_id;
        // lease_id = formData.lease_id; // Assuming lease_id is also part of the form data
    } else {
        ticket_id = req.body.ticket_id;
        label_id = req.body.label_id;
        // lease_id = req.body.lease_id; // Assuming lease_id is also part of the JSON body
    }

    // Database connection configuration
    const config = {
        user: 'dylanwalls',
        password: '950117Dy!',
        server: 'scorecard-server.database.windows.net',
        database: 'dashboard-new-server',
    };

    try {
        await sql.connect(config);
        context.log('Connected to SQL Server');

        // Proceed only if label_id is known, else skip processing
        if (['1712995', '1713013'].includes(label_id)) {
            let phoneNumber = '';
            if (ticket_id) {
                // Fetch ticket data only if ticket_id is present
                const ticketData = await fetchTicketData(ticket_id);
                context.log('Ticket Data:', ticketData);
                phoneNumber = ticketData.contact.phone;
            }

            const tenantResponse = label_id === '1712995' ? 'Extended' : 'NoticeGiven';
            const escalationStatus = 'Confirmed';

            // Construct query dynamically based on conditions
            let query = "UPDATE Leases SET tenantResponse = @tenantResponse, escalationStatus = @escalationStatus WHERE tenantMobileNo = @phoneNumber";
            let parameters = [
                { name: 'tenantResponse', type: sql.VarChar, value: tenantResponse },
                { name: 'escalationStatus', type: sql.VarChar, value: escalationStatus },
                { name: 'phoneNumber', type: sql.VarChar, value: phoneNumber }
            ];

            // if (phoneNumber) {
            //     query += " WHERE tenantMobileNo = @phoneNumber";
            //     parameters.push({ name: 'phoneNumber', type: sql.VarChar, value: phoneNumber });
            // } else {
            //     query += " WHERE lease_id = @leaseId";
            //     parameters.push({ name: 'leaseId', type: sql.Int, value: lease_id }); // Assuming lease_id is an integer, change type if necessary
            // }

            const request = new sql.Request();
            parameters.forEach(param => {
                request.input(param.name, param.type, param.value);
            });
            context.log('tenantResponse:', tenantResponse);
            context.log('escalationStatus:', escalationStatus);
            context.log('tenantMobileNo:', phoneNumber);
            context.log('Query:', query);
            const result = await request.query(query);
            context.log('RESULT', result);

            // After updating Leases table, check and insert into inspections
            if (tenantResponse === 'NoticeGiven') { // Proceed only if tenant is giving notice
                context.log('tenant response = NoticeGiven');
                const leaseInfo = await getLeaseInformation(phoneNumber);
                context.log('leaseInfo', leaseInfo);
                if (leaseInfo.length > 0) { // Ensure lease information is found
                    context.log('lease info found');
                    const { tenantName, tenantEmail, tenantMobileNo, unitNo, street, id } = leaseInfo[0];

                    // Insert into inspections if not already exists
                    // Your existing code for inserting into inspections with the generated formUrl
                    // context.log('form url', formUrl);
                    const checkQuery = `SELECT COUNT(*) AS existingCount FROM inspections WHERE lease_id = @id`;
                    const checkRequest = new sql.Request();
                    checkRequest.input('id', sql.Int, id);
                    const checkResult = await checkRequest.query(checkQuery);
                    if (checkResult.recordset[0].existingCount === 0) { // No existing inspection for this lease_id
                        const insertQuery = `INSERT INTO inspections (lease_id, escalationDate, completed) VALUES (@id, @creationDate, 0); SELECT SCOPE_IDENTITY() AS inspectionId;`;
                        // const formUrl = createJotFormUrl()
                        const today = new Date();
                        const insertRequest = new sql.Request();
                        insertRequest.input('id', sql.Int, id);
                        insertRequest.input('creationDate', sql.Date, today);
                        // insertRequest.input('formUrl', sql.VarChar, formUrl);
                        context.log('lease_id', id);
                        context.log('creation date:', today);

                        const insertResult = await insertRequest.query(insertQuery);
                        context.log('Inserted new inspection:', insertResult);
                        
                        // Retrieve the id of the newly inserted inspection
                        const inspectionId = insertResult.recordset[0].inspectionId;
                        context.log('inspectionId:', inspectionId);
                         // Assuming you have the inspector's details and other required details readily available
                        const formUrl = createJotFormUrl(tenantName, '', tenantEmail, tenantMobileNo, street, '', 'Cape Town', 'Western Cape', '8001', 'Phumlani', 'Tyali', today, id, inspectionId);
                        const maintenanceQuoteUrl = createMaintenanceQuoteUrl(tenantEmail, inspectionId, id, tenantName, tenantMobileNo, street, 'Phumlani', 'Tyali');
                        // Update the newly inserted inspection with the formUrl
                        const updateQuery = `UPDATE inspections SET prefilled_inspection_form = @formUrl, prefilled_maintenance_quotes_form = @maintenanceQuoteUrl WHERE id = @inspectionId`;
                        const updateRequest = new sql.Request();
                        updateRequest.input('formUrl', sql.VarChar, formUrl);
                        updateRequest.input('maintenanceQuoteUrl', sql.VarChar, maintenanceQuoteUrl);
                        updateRequest.input('inspectionId', sql.Int, inspectionId);
                        await updateRequest.query(updateQuery);
                        context.log('form url updated with inspectionId:', formUrl);
                    }
                }
            }



            context.res = { status: 200, body: `${tenantResponse} logic executed successfully.` };
        } else {
            context.log('Label ID does not match any predefined actions. Skipping script.');
            context.res = { status: 200, body: 'No action required for this label ID.' };
        }
    } catch (error) {
        context.log.error('Error in webhook processing:', error);
        context.res = { status: 500, body: 'Error in webhook processing.' };
    } finally {
        sql.close(); // Ensure the database connection is closed after operation
    }
};


async function fetchTicketData(ticketId) {
    const options = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjdjZjk5YmM5ZGFlODQ2Zjg5MzA0YzBmYzRmMWI5NWYwMWE4MjRjMDVkZDAxY2M3ZDlkY2FlMDEzZTIxOWM4ZDVlNzE3OTNlYThmOTE4ZTciLCJpYXQiOjE3MDk1NTY3MzAuMjE4OTE4LCJuYmYiOjE3MDk1NTY3MzAuMjE4OTIsImV4cCI6NDgzMzYwNzkzMC4yMTA0MzQsInN1YiI6IjYwNjg1NCIsInNjb3BlcyI6W119.e72mA4u-ID81C85d1ajz-PKuPMvA8LgvnPayWI3y2DQZv4ya7K9iqYFUJalHImF0x6yeXzzkG9MCwAMLFR2zxg',
            'accept': 'application/json',
            'content-type': 'application/json'
        },
    };

    try {
        const response = await fetch(`https://app.trengo.com/api/v2/tickets/${ticketId}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data; // For now, just return the entire data object
    } catch (error) {
        console.error('Error fetching ticket data:', error);
        throw error;
    }
}

async function getLeaseInformation(tenantMobileNo) {
    const query = `
        SELECT 
            l.tenantName,
            l.tenantEmail,
            l.tenantMobileNo,
            l.unitNo,
            p.street,
            l.id
        FROM leases AS l
        JOIN Properties AS p ON p.property_ref = l.buildingName
        WHERE l.tenantMobileNo = @tenantMobileNo
    `;
    const request = new sql.Request();
    request.input('tenantMobileNo', sql.VarChar, tenantMobileNo);
    const result = await request.query(query);
    return result.recordset; // Assuming there's always one match, adjust if necessary
}

function createJotFormUrl(firstName, lastName, email, phoneNumber, addrLine1, addrLine2, city, state, postal, inspectorFirstName, inspectorLastName, dateAuthorised, leaseId, inspectionId) {
    return `https://jotform.com/240733486332557?name=${encodeURIComponent(firstName)}&name[last]=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&phoneNumber[full]=${encodeURIComponent(phoneNumber)}&locationAddress[addr_line1]=${encodeURIComponent(addrLine1)}&locationAddress[addr_line2]=${encodeURIComponent(addrLine2)}&locationAddress[city]=${encodeURIComponent(city)}&locationAddress[state]=${encodeURIComponent(state)}&locationAddress[postal]=${encodeURIComponent(postal)}&inspectorName[first]=${encodeURIComponent(inspectorFirstName)}&inspectorName[last]=${encodeURIComponent(inspectorLastName)}&dateAuthorised=${encodeURIComponent(dateAuthorised)}&leaseId=${encodeURIComponent(leaseId)}&formId=${encodeURIComponent(inspectionId)}`;
}

function createMaintenanceQuoteUrl(email, formId, leaseId24, tenantName, phoneNumber, locationAddress, inspectorFirstName, inspectorLastName) {
    return `https://jotform.com/240791518217559?email=${encodeURIComponent(email)}&formId=${encodeURIComponent(formId)}&leaseId24=${encodeURIComponent(leaseId24)}&tenantName=${encodeURIComponent(tenantName)}&phoneNumber=${encodeURIComponent(phoneNumber)}&locationAddress=${encodeURIComponent(locationAddress)}&inspectorName[first]=${encodeURIComponent(inspectorFirstName)}&inspectorName[last]=${encodeURIComponent(inspectorLastName)}`;
}







// 2024-02-19T15:01:28Z   [Information]   Ticket Data: {
//   id: 745390370,
//   status: 'ASSIGNED',
//   subject: null,
//   closed_at: null,
//   created_at: '2024-02-19 16:00:08',
//   updated_at: '2024-02-19 16:01:25',
//   user_id: 606854,
//   team_id: null,
//   assigned_at: '2024-02-19 16:00:08',
//   team: null,
//   contact_id: 352133044,
//   contact: {
//     id: 352133044,
//     name: 'Dylan Walls',
//     full_name: 'Dylan Walls',
//     email: null,
//     abbr: 'D',
//     color: '#2196f3',
//     profile_image: null,
//     is_phone: true,
//     phone: '+27784130968',
//     formatted_phone: '+27 78 413 0968',
//     avatar: 'https://assets.trengo.com/release/img/defaultpic.png',
//     identifier: '+27 78 413 0968',
//     custom_field_data: { 'Referrer name': null, 'Customer number': null },
//     profile: [],
//     pivot: null,
//     groups: [],
//     formatted_custom_field_data: {
//       firstName: null,
//       "Contact's name": null,
//       'Referrer relationship': null,
//       'Referrer name': null,
//       'Contact address': null,
//       'Customer number': null
//     },
//     display_name: 'Dylan Walls (+27 78 413 0968)',
//     is_private: false,
//     custom_field_values: [ [Object], [Object] ]
//   },
//   agent: {
//     id: 606854,
//     agency_id: 266184,
//     first_name: 'Dylan',
//     last_name: 'Walls',
//     name: 'Dylan Walls',
//     full_name: 'Dylan Walls',
//     email: 'dylan.walls@bitprop.com',
//     abbr: 'D',
//     phone: null,
//     color: '#ff9800',
//     locale_code: 'en-GB',
//     status: 'ACTIVE',
//     text: 'Dylan Walls',
//     is_online: 1,
//     user_status: 'ONLINE',
//     chat_status: '1',
//     voip_status: 'OFFLINE',
//     voip_device: 'WEB',
//     profile_image: null,
//     authorization: 'OWNER',
//     role: { id: 24, name: 'administrator' },
//     is_primary: 1,
//     timezone: 'Europe/Amsterdam',
//     created_at: '2022-12-12 14:56:58',
//     two_factor_authentication_enabled: false
//   },
//   assignee: {
//     id: 606854,
//     agency_id: 266184,
//     first_name: 'Dylan',
//     last_name: 'Walls',
//     name: 'Dylan Walls',
//     full_name: 'Dylan Walls',
//     email: 'dylan.walls@bitprop.com',
//     abbr: 'D',
//     phone: null,
//     color: '#ff9800',
//     locale_code: 'en-GB',
//     status: 'ACTIVE',
//     text: 'Dylan Walls',
//     is_online: 1,
//     user_status: 'ONLINE',
//     chat_status: '1',
//     voip_status: 'OFFLINE',
//     voip_device: 'WEB',
//     profile_image: null,
//     authorization: 'OWNER',
//     role: { id: 24, name: 'administrator' },
//     is_primary: 1,
//     timezone: 'Europe/Amsterdam',
//     created_at: '2022-12-12 14:56:58',
//     two_factor_authentication_enabled: false
//   },
//   closed_by: null,
//   channel: {
//     id: 1281523,
//     name: 'Wa_business',
//     title: 'Maintenance WhatsApp',
//     phone: '',
//     type: 'WA_BUSINESS',
//     auto_reply: 'ENABLED',
//     color: null,
//     notification_email: 'dylan.walls@bitprop.com',
//     business_hour_id: 296039,
//     notification_sound: 'chat.mp3',
//     status: 'ACTIVE',
//     display_name: 'Maintenance WhatsApp',
//     text: 'Maintenance WhatsApp',
//     show_ticket_fields: 1,
//     show_contact_fields: 1,
//     emailChannel: null,
//     users: [],
//     username: '+27 60 068 4581',
//     reopen_closed_ticket: 1,
//     is_private: false,
//     reassign_reopened_ticket: false,
//     reopen_closed_ticket_time_window_days: '30',
//     password: '115951991527557'
//   },
//   channelMeta: null,
//   results: [],
//   labels: [
//     {
//       id: 1712995,
//       name: 'LeaseDecision',
//       slug: 'leasedecision',
//       color: '#4FC1E9',
//       sort_order: null,
//       archived: null
//     }
//   ],
//   reminder: null,
//   watchers: [],
//   starred: [],
//   attachments: [],
//   messaging_attachments: [],
//   custom_data: null,
//   messages_count: null,
//   related_tickets: [],
//   custom_field_values: [],
//   audits: [
//     {
//       id: 2732597064,
//       type: 'AUDIT',
//       audit_type: 'TICKET_CREATED',
//       body_type: 'TEXT',
//       message: 'Created by Dylan Walls at 19-02-2024, 15:00',
//       created_at: '2024-02-19 16:00:08'
//     },
//     {
//       id: 2732597065,
//       type: 'AUDIT',
//       audit_type: 'TICKET_PICKED_UP',
//       body_type: 'TEXT',
//       message: 'Assigned by Dylan Walls at 19-02-2024, 15:00',
//       created_at: '2024-02-19 16:00:08'
//     },
//     {
//       id: 2732600842,
//       type: 'AUDIT',
//       audit_type: 'TICKET_LABELED',
//       body_type: 'TEXT',
//       message: 'Label LeaseDecision added by rule attachLeaseDecisionLabel at 19-02-2024, 15:01',
//       created_at: '2024-02-19 16:01:25'
//     }
//   ]
// }