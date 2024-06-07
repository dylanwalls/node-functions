const sql = require('mssql');

module.exports = async function (context, req) {
    try {
        context.log('Starting tenantInformation function');

        const config = {
            user: 'dylanwalls',
            password: '950117Dy!',
            server: 'scorecard-server.database.windows.net',
            database: 'dashboard-new-server',
        };

        await sql.connect(config);
        context.log('Connected');
        context.log('REQ BODY: ', req.body);
        
        const request = new sql.Request();
        const inputFields = {
            FullName: sql.NVarChar(sql.MAX),
            TenantAddress: sql.NVarChar(sql.MAX),
            PrimaryContactNumber: sql.NVarChar(20),
            EmailAddress: sql.NVarChar(320),
            JobTitleOrEmploymentStatus: sql.NVarChar(sql.MAX),
            IncomeBracket: sql.NVarChar(sql.MAX),
            NumberOfPeopleInFlat: sql.Int,
            DistributionOfTenantsBySetup: sql.NVarChar(sql.MAX),
            RentalHistory: sql.NVarChar(sql.MAX),
            PreviousDwellingType: sql.NVarChar(sql.MAX),
            PreviousResidence: sql.NVarChar(sql.MAX),
            UnderstandsTermsAndConditions: sql.Bit,
            AwareOfResponsibilities: sql.Bit,
            Rating1: sql.Int,
            Rating2: sql.Int,
            Rating3: sql.Int,
            Rating4: sql.Int,
            Rating5: sql.Int,
            Rating6: sql.Int,
            Rating7: sql.Int,
            Rating8: sql.Int,
            Rating9: sql.Int,
            Rating10: sql.Int,
            Rating11: sql.Int,
            BuildQuality: sql.NVarChar(sql.MAX),
            Features: sql.NVarChar(sql.MAX),
            ParkingSpaceRating: sql.Int,
            LaundryRating: sql.Int,
            WifiRating: sql.Int,
            DstvRating: sql.Int,
            DesignFeedback: sql.NVarChar(sql.MAX),
            WaterFeedback: sql.NVarChar(sql.MAX),
            ElectricityFeedback: sql.NVarChar(sql.MAX),
            MaintenanceFeedback: sql.NVarChar(sql.MAX),
            SafetyFeedback: sql.NVarChar(sql.MAX),
            BitpropServiceFeedback: sql.NVarChar(sql.MAX),
            CommunicationFeedback: sql.NVarChar(sql.MAX),
            PreferredLanguage: sql.NVarChar(sql.MAX),
            ResponseTimeFeedback: sql.NVarChar(sql.MAX),
            MaintenanceProcessFeedback: sql.NVarChar(sql.MAX),
            RentalApplicationProcessFeedback: sql.NVarChar(sql.MAX),
            RentalPaymentProcessFeedback: sql.NVarChar(sql.MAX),
            MovingProcessFeedback: sql.NVarChar(sql.MAX),
            BitpropOverallServiceFeedback: sql.NVarChar(sql.MAX),
            LandlordPropertyFeedback: sql.NVarChar(sql.MAX),
            LandlordPrivacyFeedback: sql.NVarChar(sql.MAX),
            LandlordResponseFeedback: sql.NVarChar(sql.MAX),
            AreaFeedback: sql.NVarChar(sql.MAX),
            ImprovementSuggestions: sql.NVarChar(sql.MAX),
            UnderstandingMoreInfo: sql.NVarChar(sql.MAX),
            MaintenanceMoreInfo: sql.NVarChar(sql.MAX),
            date: sql.DateTime,
            IdNumber: sql.NVarChar(20),
        };

        // Iterate through the fields in the request body and add them to the SQL request
        for (const fieldName in inputFields) {
            const fieldType = inputFields[fieldName];
            const fieldValue = req.body[fieldName] || null; 
            request.input(fieldName, fieldType, fieldValue);
        }

        // Assign the currentDate to the date input
       

        const query = `
            INSERT INTO TenantInformation (
                ${Object.keys(inputFields).join(', ')}
            ) VALUES (
                ${Object.keys(inputFields).map(fieldName => `@${fieldName}`).join(', ')}
            );
        `;
        context.log('Query:', query);
        await request.query(query);

        context.log('Data inserted');

        context.res = {
            status: 200,
            body: { message: 'Data inserted successfully' },
            headers: { 'Content-Type': 'application/json' },
        };
    } catch (error) {
        context.log(`Error: ${error.message}\nStack: ${error.stack}`);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error inserting data into the database', details: error.message }),
        };
    } finally {
        sql.close();
    }
};
































// const sql = require('mssql');

// module.exports = async function (context, req) {
//     try {
//         context.log('Starting tenantInformation function');

//         const config = {
//             user: 'dylanwalls',
//             password: '950117Dy!',
//             server: 'scorecard-server.database.windows.net',
//             database: 'dashboard-new-server',
//         };

//         await sql.connect(config);
//         context.log('Connected');
//         context.log('REQ BODY: ', req.body);

//         const { 
//             fullName, address, contactNumber, email, jobTitle, 
//             incomeBracket, residents, householdSetup, rentalHistory, 
//             previousHousing, previousArea, leaseUnderstanding, 
//             maintenanceResponsibility, preferredLanguage, amenityParking, 
//             amenityLaundry, amenityWiFi, amenityDSTV, buildQuality, 
//             communicationChannel, designFeedback, electricityExperience, 
//             featuresIssues, landlordComfort, landlordPrivacy, landlordResponse, 
//             maintenanceIssues, maintenanceMoreInfo, maintenanceProcess, moreInfo,
//             movingProcess, rentalApplicationProcess, rentalPaymentProcess, 
//             reputation, responseTime, safetyFeedback, serviceExperience, 
//             supportSuggestions, waterQuality, question1, question2, 
//             question3, question4, question5, question6, question7, 
//             question8, question9, question10, question11, areaChoice, date,
//         } = req.body;

//         const currentDate = new Date().toISOString();
//         context.log('Current date: ', currentDate);
        
//         const request = new sql.Request();
//         request.input('FullName', sql.NVarChar(sql.MAX), fullName);
//         request.input('TenantAddress', sql.NVarChar(sql.MAX), address);
//         request.input('PrimaryContactNumber', sql.NVarChar(20), contactNumber);
//         request.input('EmailAddress', sql.NVarChar(320), email);
//         request.input('JobTitleOrEmploymentStatus', sql.NVarChar(sql.MAX), jobTitle);
//         request.input('IncomeBracket', sql.NVarChar(sql.MAX), incomeBracket);
//         request.input('NumberOfPeopleInFlat', sql.Int, residents);
//         request.input('DistributionOfTenantsBySetup', sql.NVarChar(sql.MAX), householdSetup);
//         request.input('RentalHistory', sql.NVarChar(sql.MAX), rentalHistory);
//         request.input('PreviousDwellingType', sql.NVarChar(sql.MAX), previousHousing);
//         request.input('PreviousResidence', sql.NVarChar(sql.MAX), previousArea);
//         request.input('UnderstandsTermsAndConditions', sql.Bit, leaseUnderstanding === 'yes' ? 1 : 0);
//         request.input('AwareOfResponsibilities', sql.Bit, maintenanceResponsibility === 'yes' ? 1 : 0);
//         request.input('PreferredLanguage', sql.NVarChar(sql.MAX), preferredLanguage);
//         request.input('ParkingSpaceRating', sql.Int, amenityParking);
//         request.input('LaundryRating', sql.Int, amenityLaundry);
//         request.input('WifiRating', sql.Int, amenityWiFi);
//         request.input('DstvRating', sql.Int, amenityDSTV);
//         request.input('BuildQuality', sql.NVarChar(sql.MAX), buildQuality);
//         request.input('CommunicationFeedback', sql.NVarChar(sql.MAX), communicationChannel);
//         request.input('DesignFeedback', sql.NVarChar(sql.MAX), designFeedback);
//         request.input('ElectricityFeedback', sql.NVarChar(sql.MAX), electricityExperience);
//         request.input('Features', sql.NVarChar(sql.MAX), featuresIssues);
//         request.input('LandlordPropertyFeedback', sql.NVarChar(sql.MAX), landlordComfort);
//         request.input('LandlordPrivacyFeedback', sql.NVarChar(sql.MAX), landlordPrivacy);
//         request.input('LandlordResponseFeedback', sql.NVarChar(sql.MAX), landlordResponse);
//         request.input('MaintenanceFeedback', sql.NVarChar(sql.MAX), maintenanceIssues);
//         request.input('MaintenanceProcessFeedback', sql.NVarChar(sql.MAX), maintenanceMoreInfo);
//         request.input('MaintenanceProcess', sql.NVarChar(sql.MAX), maintenanceProcess);
//         request.input('MoreInfo', sql.NVarChar(sql.MAX), moreInfo);
//         request.input('MovingProcessFeedback', sql.NVarChar(sql.MAX), movingProcess);
//         request.input('RentalApplicationProcessFeedback', sql.NVarChar(sql.MAX), rentalApplicationProcess);
//         request.input('RentalPaymentProcessFeedback', sql.NVarChar(sql.MAX), rentalPaymentProcess);
//         request.input('BitpropServiceFeedback', sql.NVarChar(sql.MAX), reputation);
//         request.input('ResponseTimeFeedback', sql.NVarChar(sql.MAX), responseTime);
//         request.input('SafetyFeedback', sql.NVarChar(sql.MAX), safetyFeedback);
//         request.input('ServiceExperience', sql.NVarChar(sql.MAX), serviceExperience);
//         request.input('AreaChoice', sql.NVarChar(sql.MAX), areaChoice),
//         request.input('ImprovementSuggestions', sql.NVarChar(sql.MAX), supportSuggestions);
//         request.input('WaterFeedback', sql.NVarChar(sql.MAX), waterQuality);

//         // Add the Ratings
//         request.input('Rating1', sql.Int, question1);
//         request.input('Rating2', sql.Int, question2);
//         request.input('Rating3', sql.Int, question3);
//         request.input('Rating4', sql.Int, question4);
//         request.input('Rating5', sql.Int, question5);
//         request.input('Rating6', sql.Int, question6);
//         request.input('Rating7', sql.Int, question7);
//         request.input('Rating8', sql.Int, question8);
//         request.input('Rating9', sql.Int, question9);
//         request.input('Rating10', sql.Int, question10);
//         request.input('Rating11', sql.Int, question11);
//         request.input('date', sql.DateTime, currentDate);

//         const query = `
//           INSERT INTO TenantInformation (
//               FullName, TenantAddress, PrimaryContactNumber, EmailAddress, JobTitleOrEmploymentStatus,
//               IncomeBracket, NumberOfPeopleInFlat, DistributionOfTenantsBySetup, RentalHistory, PreviousDwellingType,
//               PreviousResidence, UnderstandsTermsAndConditions, AwareOfResponsibilities, Rating1, Rating2, Rating3, Rating4, Rating5, Rating6,
//               Rating7, Rating8, Rating9, Rating10, Rating11, BuildQuality, Features, ParkingSpaceRating,
//               LaundryRating, WifiRating, DstvRating, DesignFeedback, WaterFeedback, ElectricityFeedback, MaintenanceFeedback, SafetyFeedback, BitpropServiceFeedback, CommunicationFeedback, PreferredLanguage,
//               ResponseTimeFeedback, MaintenanceProcessFeedback, RentalApplicationProcessFeedback, RentalPaymentProcessFeedback, MovingProcessFeedback, BitpropOverallServiceFeedback, LandlordPropertyFeedback, LandlordPrivacyFeedback, LandlordResponseFeedback,
//               AreaFeedback, ImprovementSuggestions, UnderstandingMoreInfo, maintenanceMoreInfo, date
               
               
//           ) VALUES (
//               @FullName, @TenantAddress, @PrimaryContactNumber, @EmailAddress, @JobTitleOrEmploymentStatus,
//               @IncomeBracket, @NumberOfPeopleInFlat, @DistributionOfTenantsBySetup, @RentalHistory, @PreviousDwellingType,
//               @PreviousResidence, @UnderstandsTermsAndConditions, @AwareOfResponsibilities, @Rating1, @Rating2, @Rating3, @Rating4, @Rating5, @Rating6,
//               @Rating7, @Rating8, @Rating9, @Rating10, @Rating11, @BuildQuality, @Features, @ParkingSpaceRating,
//               @LaundryRating, @WifiRating, @DstvRating, @DesignFeedback, @WaterFeedback, @ElectricityFeedback, @MaintenanceFeedback, @SafetyFeedback, @ServiceExperience, @CommunicationFeedback, @PreferredLanguage, 
//               @ResponseTimeFeedback, @MaintenanceProcess, @RentalApplicationProcessFeedback, @RentalPaymentProcessFeedback, @MovingProcessFeedback, @BitpropServiceFeedback, @LandlordPropertyFeedback, @LandlordPrivacyFeedback, @LandlordResponseFeedback,
//               @AreaChoice, @ImprovementSuggestions, @MoreInfo, @MaintenanceProcessFeedback, @date
                
               
//           );
//       `;

//         await request.query(query);

//         context.log('Data inserted');

//         context.res = {
//             status: 200,
//             body: { message: 'Data inserted successfully' },
//             headers: { 'Content-Type': 'application/json' },
//         };        
//     } catch (error) {
//         context.log(`Error: ${error.message}\nStack: ${error.stack}`);
//         context.res = {
//             status: 500,
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ error: 'Error inserting data into the database', details: error.message }),
//         };
//     } finally {
//         sql.close();
//     }
// };
