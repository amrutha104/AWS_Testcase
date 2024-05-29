const { CloudTrailClient, GetTrailCommand, GetEventSelectorsCommand } = require('@aws-sdk/client-cloudtrail');
const { fromIni } = require('@aws-sdk/credential-provider-ini');

const REGION_NAME = 'us-east-2';

const result = [
    { name: "CloudTrail created in the name 'TestTrail'", weightage: 0, status: false, error: '' },
    { name: "Log Event Type is 'Data Events'", weightage: 0, status: false, error: '' },
    { name: "Data event type is 'DynamoDB", weightage: 0, status: false, error: '' },
    { name: "Log selector template is 'Log readOnly events'", weightage: 0, status: false, error: '' },
];

async function validateCloudTrailConfiguration() {
    const cloudtrail = new CloudTrailClient({
        region: REGION_NAME,
        credentials,
    });

    try {
        const getTrailParams = { Name: 'TestTrail' };
        const trailData = await cloudtrail.send(new GetTrailCommand(getTrailParams));

        if (trailData) {
            result[0].status = true;
            result[0].weightage = 0.25;

            try {
                const getEventSelectorsParams = { TrailName: 'TestTrail' };
                const eventSelectorsData = await cloudtrail.send(new GetEventSelectorsCommand(getEventSelectorsParams));

                if (eventSelectorsData && eventSelectorsData.AdvancedEventSelectors && eventSelectorsData.AdvancedEventSelectors.some(selector => 
                    selector.FieldSelectors && selector.FieldSelectors.some(fieldSelector => fieldSelector.Equals && fieldSelector.Equals.includes('Data'))
                )) {
                    result[1].status = true;
                    result[1].weightage = 0.25;
                } else {
                    result[1].error = "Log Event Type is not 'Data Events'.";
                }

                try {
                    if (eventSelectorsData && eventSelectorsData.AdvancedEventSelectors && eventSelectorsData.AdvancedEventSelectors.some(selector =>
                        selector.FieldSelectors && selector.FieldSelectors.some(fieldSelector =>
                            fieldSelector && fieldSelector.Equals && fieldSelector.Equals.includes('AWS::DynamoDB::Table')
                        )
                    )) {
                        result[2].status = true;
                        result[2].weightage = 0.25;

                        try {
                            if (eventSelectorsData && eventSelectorsData.AdvancedEventSelectors && eventSelectorsData.AdvancedEventSelectors.some(selector =>
                                selector.FieldSelectors && selector.FieldSelectors.some(fieldSelector =>
                                    fieldSelector && fieldSelector.Field === 'readOnly' && fieldSelector.Equals && fieldSelector.Equals.includes('true')
                                )
                            )) {
                                result[3].status = true;
                                result[3].weightage = 0.25;
                            } else {
                                result[3].error = "Log selector template does not have the expected configuration (Field: 'readOnly', Equals: 'true').";
                            }
                        }
                        catch (error) {
                            result[3].error = "Log selector template does not have the expected configuration (Field: 'readOnly', Equals: 'true').";
                        }
                    } else {
                        result[2].error = "Data event type is not 'DynamoDB'.";
                        result[3].error = "Log selector template does not have the expected configuration (Field: 'readOnly', Equals: 'true').";
                    }
                }
                catch (error) {
                    result[2].error = "Data event type is not 'DynamoDB'.";
                    result[3].error = "Data event type is not 'DynamoDB'.";
                }
            } catch (error) {
                result[1].error = "Log Event Type is not 'Data Events'.";
                result[2].error = "Log Event Type is not 'Data Events'.";
                result[3].error = "Log Event Type is not 'Data Events'.";
            }
        } else {
            result[0].error = "Trail 'TestTrail' not found.";
            result[1].error = "Trail 'TestTrail' not found.";
            result[2].error = "Trail 'TestTrail' not found.";
            result[3].error = "Trail 'TestTrail' not found.";
        }
        return result;
    } catch (error) {
        // Update error handling to display only errors for failed test cases
        result.forEach((condition, index) => {
            if (!condition.status) {
                result[index].error = error.message;
            }
        });
        return result;
    }
}

async function main() {
    await validateCloudTrailConfiguration();
    console.log(result);
    return result;
}

main();
