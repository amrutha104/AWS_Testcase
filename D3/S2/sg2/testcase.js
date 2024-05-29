// Import the required modules from AWS SDK v3
const { EC2, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');

// Set the region
const REGION_NAME = 'eu-west-2';

const result = [
    { weightage: 0, name: "'User1' Security Group is available", status: false, error: '' },
    { weightage: 0, name: "Allow PostgreSQL in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow SMB in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow LDAP in Outbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow NFS in Outbound Rules", status: false, error: '' },
];


// Create EC2 service object
const ec2 = new EC2({ region: REGION_NAME, credentials});


async function checkSecurityGroups() {
    try {
        // Describe Security Groups by Group Name
        const data = await ec2.send(new DescribeSecurityGroupsCommand({
            GroupNames: ['User1'],
        }));
try{
        if (data.SecurityGroups && data.SecurityGroups.length > 0) {
            const instanceRules = data.SecurityGroups[0];

            result[0].weightage = 0.2;
            result[0].status = true;
try{
            // Check Inbound Rules
            if (instanceRules.IpPermissions.find((r) => r.FromPort === 5432)) {
                result[1].weightage = 0.2;
                result[1].status = true;
            } else {
                result[1].error = 'Inbound Rules for PostgreSQL is not available';
            }}
            catch(error){
                result[1].error = 'Inbound Rules for PostgreSQL is not available';
            }

            // Check RDP Rules
            try{
            if (instanceRules.IpPermissions.find((r) => r.FromPort === 445)) {
                result[2].weightage = 0.2;
                result[2].status = true;
            } else {
                result[2].error = 'Inbound Rules for SMB is not available';
            }}
            catch(error){
                result[2].error = 'Inbound Rules for SMB is not available';
            }

            // Check Outbound Rules for Oracle-RDS
            try{
            if (instanceRules.IpPermissionsEgress.find((r) => r.FromPort === 389)) {
                result[3].weightage = 0.2;
                result[3].status = true;
            } else {
                result[3].error = 'Outbound Rules for LDAP is not available';
            }}
            catch(error){
                result[3].error = 'Outbound Rules for LDAP is not available';
            }

            // Check Outbound Rules for WinRM-HTTP
            try{
            if (instanceRules.IpPermissionsEgress.find((r) => r.FromPort === 2049)) {
                result[4].weightage = 0.2;
                result[4].status = true;
            } else {
                result[4].error = 'Outbound Rules for NFS is not available';
            }}
            catch(error){
                result[4].error = 'Outbound Rules for NFS is not available';
            }

        } else {
            result[0].error = `Security Group 'User1' is not available`;
            result.forEach((r, i) => {
                if (i > 0) {
                    r.error = `Security Group 'User1' is not available to validate ${r.name}`;
                }
            });
        }
    }
    catch(error){
        result[0].error = `Security Group 'User1' is not available`;
            result.forEach((r, i) => {
                if (i > 0) {
                    r.error = `Security Group 'User1' is not available to validate ${r.name}`;
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
