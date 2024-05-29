const { CloudWatchClient, DescribeAlarmsCommand } = require('@aws-sdk/client-cloudwatch');

const REGION_NAME = 'us-east-1';
const result = [
    { name: "Alarm Created in the name 'S3Monitor'", weightage: 0, status: false, error: '' },
    { name: "Alarm created for the Metric 'NumberOfObjects'", weightage: 0, status: false, error: '' },
    { name: "The period given is '1 Hour'", weightage: 0, status: false, error: '' },
    { name: "The Threshold is set to Greater than or Equal to 2", weightage: 0, status: false, error: '' },
];

async function validateCloudWatchAlarms() {
    const cloudwatch = new CloudWatchClient({
        region: REGION_NAME,
        credentials,
    });

    try {
        const params = {
            AlarmNames: ['S3Monitor'],
        };

        const data = await cloudwatch.send(new DescribeAlarmsCommand(params));

        if (data.MetricAlarms.some(alarm => alarm)) {
            result[0].status = true;
            result[0].weightage = 0.25;
            try {
                if (data.MetricAlarms.some(alarm => alarm && alarm.MetricName === "NumberOfObjects")) {
                    result[1].status = true;
                    result[1].weightage = 0.25;
                } else {
                    result[1].error = "Alarm does not have the expected MetricName 'NumberOfObjects'.";
                }
            } catch (error) {
                result[1].error = "Alarm does not have the expected MetricName 'NumberOfObjects'.";
            }
            try {
                if (data.MetricAlarms.some(alarm => alarm.Period === 3600)) {
                    result[2].status = true;
                    result[2].weightage = 0.25;
                } else {
                    result[2].error = "Alarm does not have the expected Period of 1 Hour (3600 seconds).";
                }
            } catch (error) {
                result[2].error = "Alarm does not have the expected Period of 1 Hour (3600 seconds).";
            }
            try {
                if (data.MetricAlarms.some(alarm => alarm.Threshold === 2 && alarm.ComparisonOperator === "GreaterThanOrEqualToThreshold")) {
                    result[3].status = true;
                    result[3].weightage = 0.25;
                } else {
                    result[3].error = "Alarm does not have the expected Threshold (2) or ComparisonOperator ('GreaterThanOrEqualToThreshold').";
                }
            } catch (error) {
                result[3].error = "Alarm does not have the expected Threshold (2) or ComparisonOperator ('GreaterThanOrEqualToThreshold').";
            }
        } else {
            result.forEach(condition => {
                condition.error = "Alarm 'S3Monitor' not found.";
            });
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
    const result = await validateCloudWatchAlarms();
    console.log(result);
    return result;
}

main();
