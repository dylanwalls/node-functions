const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY_LEASES); // Make sure to set this in your Application Settings

    const { leaseId, newRentAmount, tenantEmail, tenantName, unitNo, rentEscalationDate } = req.body;
    context.log(leaseId);
    context.log(newRentAmount);
    context.log(tenantEmail);

    // Customize your email content
    const content = `
        Dear ${tenantName},

        This is a notice of rent escalation for your unit ${unitNo}, effective from ${rentEscalationDate}. The new monthly rent will be ${newRentAmount}.

        Please select one of the following options:

        <table cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" width="200" height="40" bgcolor="#0000FF" style="display: block;">
                <a href="https://dashboard-function-app-1.azurewebsites.net/api/updateLeaseDecision?code=ZSVVczzAqz8QHAiMJCuxwo0eX1vZRuivUXnFUXCeimf0AzFu0gfgEQ==&ticket_id=${leaseId}&label_id=1712995" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; line-height:40px; width:100%; display:inline-block">Extend Lease</a>
            </td>
        </tr>
        <tr>
            <td align="center" width="200" height="40" bgcolor="#FF0000" style="display: block; margin-top: 20px;">
                <a href="https://dashboard-function-app-1.azurewebsites.net/api/updateLeaseDecision?code=ZSVVczzAqz8QHAiMJCuxwo0eX1vZRuivUXnFUXCeimf0AzFu0gfgEQ==&ticket_id=${leaseId}&label_id=1713013" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; line-height:40px; width:100%; display:inline-block">Give Notice</a>
            </td>
        </tr>
        </table>

        Please feel free to contact us if you have any questions.

        Best regards,
        [Your Company Name]
        `;



    const message = {
        to: tenantEmail,
        from: 'info@bitprop.com', // Replace with your SendGrid verified sender
        subject: `Rent Escalation Notice for Unit ${unitNo}`,
        html: content,
    };

    try {
        await sgMail.send(message);
        context.res = {
            // status defaults to 200
            body: "Email sent successfully."
        };
    } catch (error) {
        context.log.error(error);

        context.res = {
            status: 500,
            body: "Failed to send the email."
        };
    }
};
