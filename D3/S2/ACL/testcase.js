// Import the required modules from AWS SDK v3
const { EC2Client, DescribeNetworkAclsCommand } = require('@aws-sdk/client-ec2');

// Set the region
const REGION_NAME = 'us-east-2';

const result = [
    { weightage: 0, name: "'Practicenet' Network ACL is available", status: false, error: '' },
    { weightage: 0, name: "Allow 'SMTPS' in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Deny 'SSH' in Inbound Rules", status: false, error: '' },
    { weightage: 0, name: "Allow 'MS SQL' in Outbound Rules", status: false, error: '' },
    { weightage: 0, name: "Deny 'WinRM-HTTPS' in Outbound Rules", status: false, error: '' },
];

async function checkNetworkACL() {
    try {
        // Create EC2 service object
        const ec2 = new EC2Client({ region: REGION_NAME , credentials});

        // Describe Network ACLs
        const data = await ec2.send(new DescribeNetworkAclsCommand({
            Filters: [{
                Name: "tag:Name",
                Values: ["Practicenet"],
            }]
        }));

        if (data.NetworkAcls && data.NetworkAcls.length > 0) {
            result[0].weightage = 0.2;
            result[0].status = true;

            // Check Inbound Rules
            const inboundSMTPS = data.NetworkAcls[0].Entries.find(r => r.PortRange && r.PortRange.From === 465 && r.RuleAction === 'allow' && !r.Egress);
            if (inboundSMTPS) {
                result[1].weightage = 0.2;
                result[1].status = true;
            } else {
                result[1].error = "Allow 'SMTPS' in Inbound Rules is not available";
            }

            const inboundSSH = data.NetworkAcls[0].Entries.find(r => r.PortRange && r.PortRange.From === 22 && r.RuleAction === 'deny' && !r.Egress);
            if (inboundSSH) {
                result[2].weightage = 0.2;
                result[2].status = true;
            } else {
                result[2].error = "Deny 'SSH' in Inbound Rules is not available";
            }

            // Check Outbound Rules
            const outboundMSSQL = data.NetworkAcls[0].Entries.find(r => r.PortRange && r.PortRange.From === 1433 && r.RuleAction === 'allow' && r.Egress);
            if (outboundMSSQL) {
                result[3].weightage = 0.2;
                result[3].status = true;
            } else {
                result[3].error = "Allow 'MS SQL' in Outbound Rules is not available";
            }

            const outboundWinRMHTTPS = data.NetworkAcls[0].Entries.find(r => r.PortRange && r.PortRange.From === 5986 && r.RuleAction === 'deny' && r.Egress);
            if (outboundWinRMHTTPS) {
                result[4].weightage = 0.2;
                result[4].status = true;
            } else {
                result[4].error = "Deny 'WinRM-HTTPS' in Outbound Rules is not available";
            }
        } else {
            const errorMessage = "'Practicenet' Network ACL is not available";
            result[0].error = errorMessage;
            result[1].error = errorMessage + " to validate 'Allow 'SMTPS' in Inbound Rules'";
            result[2].error = errorMessage + " to validate 'Deny 'SSH' in Inbound Rules'";
            result[3].error = errorMessage + " to validate 'Allow 'MS SQL' in Outbound Rules'";
            result[4].error = errorMessage + " to validate 'Deny 'WinRM-HTTPS' in Outbound Rules'";
        }
    } catch (error) {
        // Handle errors
        const errorMessage = `Network ACL error: ${error.message}`;
        result.forEach((condition, index) => {
            result[index].error = errorMessage;
        });
    }
    return result;
}

async function main() {
    const result = await checkNetworkACL();
    console.log(result);
    return result;
}

main();
