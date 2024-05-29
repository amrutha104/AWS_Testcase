// Import the required modules from AWS SDK v3
const { EC2Client, DescribeVpcsCommand, DescribeVpcPeeringConnectionsCommand, DescribeRouteTablesCommand } = require('@aws-sdk/client-ec2');

// Set the region
const REGION_NAME = 'eu-west-1';

const result = [
  { weightage: 0, name: "VPC name is 'Prod'", status: false, error: '' },
  { weightage: 0, name: "VPC 'Prod' IPv4 CIDR is '165.120.0.0/16'", status: false, error: '' },
  { weightage: 0, name: "VPC name is 'Demo'", status: false, error: '' },
  { weightage: 0, name: "VPC 'Demo' IPv4 CIDR is '165.125.0.0/16'", status: false, error: '' },
  { weightage: 0, name: "VPC Peering Name is 'Prod-Demo'", status: false, error: '' },
  { weightage: 0, name: "Route entries between Prod and Demo are correct", status: false, error: '' },
  { weightage: 0, name: "Route entries between Demo and Prod are correct", status: false, error: '' }
];

const ec2 = new EC2Client({ region: REGION_NAME, credentials });

async function getMainRouteTableId(vpcId) {
  try {
    const routeTablesData = await ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
    const mainRouteTable = routeTablesData.RouteTables.find(rt => rt.Associations.some(assoc => assoc.Main));
    return mainRouteTable.RouteTableId;
  } catch (error) {
    console.error('Error getting main route table ID:', error);
    throw error;
  }
}

async function hasCIDRInRouteTable(routeTableId, cidrBlock) {
  try {
    const routeTableData = await ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: [routeTableId] }));
    const route = routeTableData.RouteTables[0].Routes.find(route => route.DestinationCidrBlock === cidrBlock);
    return !!route;
  } catch (error) {
    console.error('Error checking CIDR in route table:', error);
    throw error;
  }
}

async function validateConditions() {
  try {
    // Describe VPCs
    const vpcsData = await ec2.send(new DescribeVpcsCommand({}));

    // Get VPC IDs by name
    const user = vpcsData.Vpcs.find(vpc => vpc.Tags && vpc.Tags.some(tag => tag.Key === 'Name' && tag.Value === 'Prod'));
    const testing = vpcsData.Vpcs.find(vpc => vpc.Tags && vpc.Tags.some(tag => tag.Key === 'Name' && tag.Value === 'Demo'));

    let vpcNameFound = false;

    for (const vpc of vpcsData.Vpcs) {
      if (vpc.Tags) {
        const vpcNameTag = vpc.Tags.find(tag => tag.Key === 'Name');
        if (vpcNameTag) {
          vpcNameFound = true;
          if (vpcNameTag.Value === 'Prod') {
            result[0].weightage = 0.1;
            result[0].status = true;
            try {
              if (vpc.CidrBlock === '165.120.0.0/16') {
                result[1].weightage = 0.1;
                result[1].status = true;
              } else {
                result[1].error = "VPC 'User' IPv4 CIDR is not '165.120.0.0/16'";
              }
            } catch (error) {
              result[1].error = "Error checking VPC 'Prod' IPv4 CIDR";
            }
          } else if (vpcNameTag.Value === 'Demo') {
            result[2].weightage = 0.1;
            result[2].status = true;
            try {
              if (vpc.CidrBlock === '165.125.0.0/16') {
                result[3].weightage = 0.1;
                result[3].status = true;
              } else {
                result[3].error = "VPC 'Testing' IPv4 CIDR is not '165.125.0.0/16'";
              }
            } catch (error) {
              result[3].error = "Error checking VPC 'Testing' IPv4 CIDR";
            }
          }
        }
      }
    }

    if (!vpcNameFound) {
      result[0].error = "VPC name 'Prod' not available";
      result[1].error = "VPC 'Prod' IPv4 CIDR is not '165.120.0.0/16'";
      result[2].error = "VPC name 'Demo' not available";
      result[3].error = "VPC 'Demo' IPv4 CIDR is not '165.125.0.0/16'";
    }

    // Describe VPC Peering Connections
    const peeringConnectionsData = await ec2.send(new DescribeVpcPeeringConnectionsCommand({}));

    if (peeringConnectionsData.VpcPeeringConnections.length > 0) {
      for (const peeringConnection of peeringConnectionsData.VpcPeeringConnections) {
        const accepterVpcInfo = peeringConnection.AccepterVpcInfo && peeringConnection.AccepterVpcInfo.CidrBlock;
        const requesterVpcInfo = peeringConnection.RequesterVpcInfo && peeringConnection.RequesterVpcInfo.CidrBlock;

        try {
          if (peeringConnection.Tags && peeringConnection.Tags.some(tag => tag.Key === 'Name' && tag.Value === 'Prod-Demo') &&
            peeringConnection.Status && peeringConnection.Status.Code === 'active') {
            result[4].weightage = 0.2;
            result[4].status = true;
          } else {
            result[4].error = "VPC Peering Name is not 'Prod-Demo'";
          }
        } catch (error) {
          result[4].error = "Error checking VPC Peering Name 'Prod-Demo'";
        }

        try {
          if (
            testing && accepterVpcInfo === testing.CidrBlock &&
            user && requesterVpcInfo === user.CidrBlock
          ) {
            const userRouteTableId = await getMainRouteTableId(user.VpcId);
            const testingRouteTableId = await getMainRouteTableId(testing.VpcId);

            if (await hasCIDRInRouteTable(userRouteTableId, testing.CidrBlock)) {
              result[5].weightage = 0.2;
              result[5].status = true;
            } else {
              result[5].error = "Route entries between Prod and Demo are not correct";
            }

            if (await hasCIDRInRouteTable(testingRouteTableId, user.CidrBlock)) {
              result[6].weightage = 0.2;
              result[6].status = true;
            } else {
              result[6].error = "Route entries between Demo and Prod are not correct";
            }
          } else {
            result[5].error = "Route entries between Prod and Demo are not correct";
            result[6].error = "Route entries between Demo and Prod are not correct";
          }
        } catch (error) {
          result[5].error = "Error checking route entries between Prod and Demo";
          result[6].error = "Error checking route entries between Demo and Prod";
        }
      }
    } else {
      result[4].error = "VPC Peering Name 'Prod-Demo' not available";
      result[5].error = "VPC Peering Name 'Prod-Demo' not available to validate Route entries between Prod and Demo";
      result[6].error = "VPC Peering Name 'Prod-Demo' not available to validate Route entries between Demo and Prod";
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
  const results = await validateConditions();
  console.log(results);
  return results;
}

main();
  
