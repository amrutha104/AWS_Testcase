// Import the required modules from AWS SDK v3
const { EC2 } = require('@aws-sdk/client-ec2');

// Set the region
const REGION_NAME = 'eu-west-1';

const result = [
    { weightage: 0, name: "VPC 'user-vpc' is available", status: false, error: '' },
    { weightage: 0, name: "VPC CIDR is 172.145.0.0/16", status: false, error: '' },
    { weightage: 0, name: "The Private Subnet CIDR is 172.145.1.0/24", status: false, error: '' },
    { weightage: 0, name: "The Private Subnet is available on eu-west-1a", status: false, error: '' },
];
async function checkVPC() {
    // Create EC2 service object
    const ec2 = new EC2({ region: REGION_NAME , credentials});

    try {
        // Describe VPCs
        const vpcData = await ec2.describeVpcs({
            Filters: [
                { Name: "tag:Name", Values: ["user-vpc"] },
                { Name: "cidr", Values: ["172.145.0.0/16"] },
            ],
        });

        if (vpcData.Vpcs && vpcData.Vpcs.length > 0) {
            for (const vpc of vpcData.Vpcs) {
                const vpcNameTag = vpc.Tags.find(tag => tag.Key === "Name" && tag.Value === "user-vpc");

                if (vpcNameTag) {
                    result[0].weightage = 0.25;
                    result[0].status = true;
                } else {
                    result[0].error = "VPC 'user-vpc' is not available";
                }

                try {
                    if (vpc.CidrBlock === "172.145.0.0/16") {
                        result[1].weightage = 0.25;
                        result[1].status = true;
                    } else {
                        result[1].error = "VPC CIDR is not 172.145.0.0/16";
                    }
                } catch (error) {
                    result[1].error = "VPC CIDR is not 172.145.0.0/16";
                }

                // Describe Subnets
                const subnetData = await ec2.describeSubnets({
                    Filters: [{ Name: "vpc-id", Values: [vpc.VpcId] }],
                });

                try {
                    if (subnetData.Subnets && subnetData.Subnets.length > 0) {
                        for (const subnet of subnetData.Subnets) {
                            try {
                                if (subnet.CidrBlock === "172.145.1.0/24") {
                                    result[2].weightage = 0.25;
                                    result[2].status = true;
                                } else {
                                    result[2].error = "The Private Subnet CIDR is not 172.145.1.0/24";
                                }
                            } catch (error) {
                                result[2].error = "The Private Subnet CIDR is not 172.145.1.0/24";
                            }

                            try {
                                if (subnet.AvailabilityZone === "eu-west-1a") {
                                    result[3].weightage = 0.25;
                                    result[3].status = true;
                                } else {
                                    result[3].error = "The Private Subnet is not available on eu-west-1a";
                                }
                            } catch (error) {
                                result[3].error = "The Private Subnet is not available on eu-west-1a";
                            }
                        }
                    } else {
                        result[2].error = "The Private Subnet CIDR is not 172.145.1.0/24";
                        result[3].error = "The Private Subnet is not available on eu-west-1a";
                    }
                } catch (error) {
                    result[2].error = "Error describing subnets: " + error.message;
                    result[3].error = "Error describing subnets: " + error.message;
                }
            }
        } else {
            result[0].error = "VPC 'user-vpc' is not available";
            result[1].error = "VPC 'user-vpc' is not available to validate VPC CIDR is 172.145.0.0/16";
            result[2].error = "VPC 'user-vpc' is not available to validate The Private Subnet CIDR is 172.145.1.0/24";
            result[3].error = "VPC 'user-vpc' is not available to validate The Private Subnet is available on eu-west-1a";
        }
    } catch (error) {
        const errorMessage = `${error.message}`;
        result.forEach((condition, index) => {
            result[index].error = errorMessage;
        });
    }
    return result;
}

async function main() {
    const results = await checkVPC();
    console.log(results);
    return results;
}

main();
