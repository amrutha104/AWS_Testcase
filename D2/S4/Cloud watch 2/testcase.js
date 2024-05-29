const { CloudWatchClient, DescribeAlarmsCommand } = require('@aws-sdk/client-cloudwatch');

const REGION_NAME = 'eu-west-2';  // Change to London region
const result = [
    { name: "Alarm Created in the name 'EC2CPUUtilizationMonitor'", weightage: 0, status: false, error: '' },
    { name: "Alarm created for the Metric 'CPUUtilization'", weightage: 0, status: false, error: '' },
    { name: "The period given is '5 Minutes'", weightage: 0, status: false, error: '' },
    { name: "The Threshold is set to Greater than or Equal to 80", weightage: 0, status: false, error: '' },
];

async function validateCloudWatchAlarms() {
    const cloudwatch = new CloudWatchClient({
        region: REGION_NAME,
        credentials,  // Ensure credentials are defined elsewhere in your code
    });

    try {
        const params = {
            AlarmNames: ['EC2CPUUtilizationMonitor'],  // Updated alarm name
        };

        const data = await cloudwatch.send(new DescribeAlarmsCommand(params));

        if (data.MetricAlarms.some(alarm => alarm)) {
            result[0].status = true;
            result[0].weightage = 0.25;
            try {
                if (data.MetricAlarms.some(alarm => alarm && alarm.MetricName === "CPUUtilization")) {  // Updated metric name
                    result[1].status = true;
                    result[1].weightage = 0.25;
                } else {
                    result[1].error = "Alarm does not have the expected MetricName 'CPUUtilization'.";
                }
            } catch (error) {
                result[1].error = "Alarm does not have the expected MetricName 'CPUUtilization'.";
            }
            try {
                if (data.MetricAlarms.some(alarm => alarm.Period === 300)) {  // Updated period to 5 minutes (300 seconds)
                    result[2].status = true;
                    result[2].weightage = 0.25;
                } else {
                    result[2].error = "Alarm does not have the expected Period of 5 Minutes (300 seconds).";
                }
            } catch (error) {
                result[2].error = "Alarm does not have the expected Period of 5 Minutes (300 seconds).";
            }
            try {
                if (data.MetricAlarms.some(alarm => alarm.Threshold === 80 && alarm.ComparisonOperator === "GreaterThanOrEqualToThreshold")) {  // Updated threshold
                    result[3].status = true;
                    result[3].weightage = 0.25;
                } else {
                    result[3].error = "Alarm does not have the expected Threshold (80) or ComparisonOperator ('GreaterThanOrEqualToThreshold').";
                }
            } catch (error) {
                result[3].error = "Alarm does not have the expected Threshold (80) or ComparisonOperator ('GreaterThanOrEqualToThreshold').";
            }
        } else {
            result.forEach(condition => {
                condition.error = "Alarm 'EC2CPUUtilizationMonitor' not found.";
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
    const validationResults = await validateCloudWatchAlarms();
    console.log(validationResults);
    return validationResults;
}

main();
