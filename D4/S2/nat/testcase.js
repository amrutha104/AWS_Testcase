// Import the required modules from AWS SDK v3
const { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeRouteTablesCommand, DescribeNatGatewaysCommand } = require('@aws-sdk/client-ec2');

// Set the region
const REGION_NAME = 'us-east-2';

// Define test result details
const result = [
  { weightage: 0, name: "VPC 'Name' tag must be 'AdminVPC'", status: false, error: '' },
  { weightage: 0, name: "Subnet 'Name' must be 'Admin-subnet'", status: false, error: '' },
  { weightage: 0, name: "Route table 'Name' must be 'Admin-rt'", status: false, error: '' },
  { weightage: 0, name: "'Admin-rt' route table must use the 'AdminVPC' VPC", status: false, error: '' },
  { weightage: 0, name: "NAT Gateway 'Name' must be 'Testing-gateway' is selected as NAT subnet", status: false, error: '' }
];

// Create EC2 service object
const ec2 = new EC2Client({ region: REGION_NAME, credentials, });

async function validateConditions() {
  try {
    // Describe VPCs, Subnets, Route Tables, and NAT Gateways
    const [vpcs, subnets, routeTables, natGateways] = await Promise.all([
      ec2.send(new DescribeVpcsCommand({})),
      ec2.send(new DescribeSubnetsCommand({})),
      ec2.send(new DescribeRouteTablesCommand({})),
      ec2.send(new DescribeNatGatewaysCommand({}))
    ]);

    const AdminVPC = vpcs.Vpcs.find(vpc => vpc.Tags && vpc.Tags.find(tag => tag.Key === 'Name' && tag.Value === 'AdminVPC'));

    if (AdminVPC) {
      result[0].weightage = 0.2;
      result[0].status = true;
      try {
        const subnet = subnets.Subnets.find(s => s.VpcId === AdminVPC.VpcId && s.Tags && s.Tags.find(tag => tag.Key === 'Name' && tag.Value === 'Admin-subnet'));
        if (subnet) {
          result[1].weightage = 0.2;
          result[1].status = true;
          try {
            const routeTable = routeTables.RouteTables.find(rt => rt.VpcId === AdminVPC.VpcId && rt.Tags && rt.Tags.find(tag => tag.Key === 'Name' && tag.Value === 'Admin-rt'));
            if (routeTable) {
              result[2].weightage = 0.2;
              result[2].status = true;
              try {
                const associatedRoutes = routeTable.Routes.filter(route => route.VpcPeeringConnectionId === undefined && route.NatGatewayId === undefined);
                if (associatedRoutes.length > 0) {
                  result[3].weightage = 0.2;
                  result[3].status = true;
                } else {
                  result[3].error = "Route table 'Admin-rt' is not associated with the VPC 'AdminVPC'";
                }
              }
              catch (error) {
                result[3].error = "Route table 'Admin-rt' is not associated with the VPC 'AdminVPC'";
              }
            } else {
              result[2].error = "Route table with 'Name' tag 'Admin-rt' not found in the AdminVPC";
              result[3].error = "Route table 'Admin-rt' is not associated with the VPC 'AdminVPC'";
            }
          }
          catch (error) {
            result[2].error = "Route table with 'Name' tag 'Admin-rt' not found in the AdminVPC";
            result[3].error = "Route table 'Admin-rt' is not associated with the VPC 'AdminVPC'";
          }
          // console.log('natGateways:', natGateways);
          try {
            const natGateway = Array.isArray(natGateways.NatGateways) ? natGateways.NatGateways.find(ng => {
              // console.log('ng.Tags:', ng.Tags);
              return ng.Tags && ng.Tags.find(tag => tag.Key === 'Name' && tag.Value === 'Testing-gateway');
            }) : undefined;
            if (natGateway && natGateway.SubnetId === subnet.SubnetId) {
              result[4].weightage = 0.2;
              result[4].status = true;
            } else if (!natGateways) {
              result[4].error = "No NAT gateways found for the AdminVPC";
            } else {
              result[4].error = "NAT Gateway named 'Testing-gateway' not found in the AdminVPC";
            }
          }
          catch (error) {
            result[4].error = "NAT Gateway named 'Testing-gateway' not found in the AdminVPC";
          }

        } else {
          result[1].error = "Subnet named 'Admin-subnet' not found in the AdminVPC";
          result[2].error = "Subnet named 'Admin-subnet' not found in the AdminVPC to validate route table 'Admin-rt'";
          result[3].error = "Subnet named 'Admin-subnet' not found in the AdminVPC to validate route table 'Admin-rt'";
          result[4].error = "NAT Gateway named 'Testing-gateway' not found in the AdminVPC";
        }
      }
    catch (error) {
      result[1].error = "Subnet named 'Admin-subnet' not found in the AdminVPC";
      result[2].error = "Subnet named 'Admin-subnet' not found in the AdminVPC to validate route table 'Admin-rt'";
      result[3].error = "Subnet named 'Admin-subnet' not found in the AdminVPC to validate route table 'Admin-rt'";
      result[4].error = "NAT Gateway named 'Testing-gateway' not found in the AdminVPC";
    }
  } else {
    result[0].error = "VPC named 'AdminVPC' not found";
    result[1].error = "VPC named 'AdminVPC' not found to validate subnet 'Admin-subnet'";
    result[2].error = "VPC named 'AdminVPC' not found to validate route table 'Admin-rt'";
    result[3].error = "VPC named 'AdminVPC' not found to validate route table 'Admin-rt'";
    result[4].error = "VPC named 'AdminVPC' not found to validate NAT Gateway 'Testing-gateway'";
  }
  return result;
} 
  catch (error) {
  const errorMessage = `${error.message}`;
  result.forEach((condition, index) => {
    result[index].error = errorMessage;
  });
}
return result;
}

async function main() {
  const results = await validateConditions();
  console.log(results);
  return results;
}

main();