const { EC2, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');

// Set the region
const REGION_NAME = 'us-west-2';

const result = [
    { weightage: 0, name: "'Admin' Security Group is available", status: false, error: '' },
    { weightage: 0, name: "Allow MySQL/Aurora in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow RDP in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow Oracle-RDS in Outbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow WinRM-HTTP in Outbound Rules", status: false, error: '' },
];

// Create EC2 service object
const ec2 = new EC2({ region: REGION_NAME, credentials });

async function checkSecurityGroups() {
    try {
        // Describe Security Groups by Group Name
        const data = await ec2.send(new DescribeSecurityGroupsCommand({
            GroupNames: ['Admin'],
        }));
try{
        if (data.SecurityGroups && data.SecurityGroups.length > 0) {
            const instanceRules = data.SecurityGroups[0];

            result[0].weightage = 0.2;
            result[0].status = true;
try{
            // Check Inbound Rules
            if (instanceRules.IpPermissions.find((r) => r.FromPort === 3306)) {
                result[1].weightage = 0.2;
                result[1].status = true;
            } else {
                result[1].error = 'Inbound Rules for MySQL/Aurora is not available';
            }}
            catch(error){
                result[1].error = 'Inbound Rules for MySQL/Aurora is not available';
            }

            // Check RDP Rules
            try{
            if (instanceRules.IpPermissions.find((r) => r.FromPort === 3389)) {
                result[2].weightage = 0.2;
                result[2].status = true;
            } else {
                result[2].error = 'Inbound Rules for RDP is not available';
            }}
            catch(error){
                result[2].error = 'Inbound Rules for RDP is not available';
            }

            // Check Outbound Rules for Oracle-RDS
            try{
            if (instanceRules.IpPermissionsEgress.find((r) => r.FromPort === 1521)) {
                result[3].weightage = 0.2;
                result[3].status = true;
            } else {
                result[3].error = 'Outbound Rules for Oracle-RDS is not available';
            }}
            catch(error){
                result[3].error = 'Outbound Rules for Oracle-RDS is not available';
            }

            // Check Outbound Rules for WinRM-HTTP
            try{
            if (instanceRules.IpPermissionsEgress.find((r) => r.FromPort === 5985)) {
                result[4].weightage = 0.2;
                result[4].status = true;
            } else {
                result[4].error = 'Outbound Rules for WinRM-HTTP is not available';
            }}
            catch(error){
                result[4].error = 'Outbound Rules for WinRM-HTTP is not available';
            }

        } else {
            result[0].error = `Security Group 'Admin' is not available`;
            result.forEach((r, i) => {
                if (i > 0) {
                    r.error = `Security Group 'Admin' is not available to validate ${r.name}`;
                }
            });
        }
    }
    catch(error){
        result[0].error = `Security Group 'Admin' is not available`;
            result.forEach((r, i) => {
                if (i > 0) {
                    r.error = `Security Group 'Admin' is not available to validate ${r.name}`;
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
