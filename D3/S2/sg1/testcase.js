const { EC2, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');

// Set the region
const REGION_NAME = 'ca-central-1';

const result = [
    { weightage: 0, name: "'Practice' Security Group is available", status: false, error: '' },
    { weightage: 0, name: "Allow SSH in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow SMTPS in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow WinRM-HTTPS in Outbound Rules", status: false, error: '' },
];

// Create EC2 service object
const ec2 = new EC2({ region: REGION_NAME, credentials });

async function checkSecurityGroups() {
    try {
        // Describe Security Groups by Group Name
        const data = await ec2.send(new DescribeSecurityGroupsCommand({
            GroupNames: ['Practice'],
        }));
try{
        if (data.SecurityGroups && data.SecurityGroups.length > 0) {
            const instanceRules = data.SecurityGroups[0];

            result[0].weightage = 0.25;
            result[0].status = true;
try{
            // Check Inbound Rules
            if (instanceRules.IpPermissions.find((r) => r.FromPort === 22)) {
                result[1].weightage = 0.25;
                result[1].status = true;
            } else {
                result[1].error = 'Inbound Rules for SSH is not available';
            }}
            catch(error){
                result[1].error = 'Inbound Rules for SSH is not available';
            }

            // Check RDP Rules
            try{
            if (instanceRules.IpPermissions.find((r) => r.FromPort === 465)) {
                result[2].weightage = 0.25;
                result[2].status = true;
            } else {
                result[2].error = 'Inbound Rules for SMTPS is not available';
            }}
            catch(error){
                result[2].error = 'Inbound Rules for SMTPS is not available';
            }

            // Check Outbound Rules for WinRM-HTTP
            try{
            if (instanceRules.IpPermissionsEgress.find((r) => r.FromPort === 5986)) {
                result[3].weightage = 0.25;
                result[3].status = true;
            } else {
                result[3].error = 'Outbound Rules for WinRM-HTTPS is not available';
            }}
            catch(error){
                result[3].error = 'Outbound Rules for WinRM-HTTPS is not available';
            }

        } else {
            result[0].error = `Security Group 'Practice' is not available`;
            result.forEach((r, i) => {
                if (i > 0) {
                    r.error = `Security Group 'Practice' is not available to validate ${r.name}`;
                }
            });
        }
    }
    catch(error){
        result[0].error = `Security Group 'Practice' is not available`;
            result.forEach((r, i) => {
                if (i > 0) {
                    r.error = `Security Group 'Practice' is not available to validate ${r.name}`;
                }
            });
    }
    } catch (error) {
        const errorMessage = `Security Group error: ${error.message}`;
        result.forEach((r) => {
            r.error = errorMessage;
        });
    }
    return result;
}

async function main() {
    const result = await checkSecurityGroups();
    console.log(result);
    return result;
}

main();
