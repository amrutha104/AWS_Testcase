const { EC2 } = require('@aws-sdk/client-ec2');

const result = [
  { weightage: 0, name: "'new-vpc' is available", status: false, error: '' },
  { weightage: 0, name: "VPC CIDR is '10.20.0.0/16'", status: false, error: '' },
  { weightage: 0, name: "'us-east-2a' has a subnet with the CIDR '10.20.1.0/24'", status: false, error: '' },
  { weightage: 0, name: "'us-east-2b' has a subnet with the CIDR '10.20.2.0/24'", status: false, error: '' },
  { weightage: 0, name: "Internet gateway is attached to 'new-vpc'", status: false, error: '' },
  { weightage: 0, name: "Internet gateway is added in the route table", status: false, error: '' },
];

async function checkVPC() {
  const ec2 = new EC2({ region: 'us-east-2', credentials });

  try {
    // Describe VPC
    const vpcData = await ec2.describeVpcs({
      Filters: [
        { Name: 'tag:Name', Values: ['new-vpc'] },
        { Name: 'cidr', Values: ['10.20.0.0/16'] },
      ],
    });

    if (vpcData.Vpcs && vpcData.Vpcs.length > 0) {
      for (const vpc of vpcData.Vpcs) {
        const vpcNameTag = vpc.Tags.find(tag => tag.Key === "Name" && tag.Value === "new-vpc");

        if (vpcNameTag) {
          result[0].weightage = 0.1;
          result[0].status = true;
        } else {
          result[0].error = "VPC 'new-vpc' is not available";
        }

        try {
          if (vpc.CidrBlock === '10.20.0.0/16') {
            result[1].weightage = 0.1;
            result[1].status = true;
          } else {
            result[1].error = "VPC CIDR is not '10.20.0.0/16'";
          }
        } catch (error) {
            result[1].error = "Error checking VPC CIDR: " + error.message;
        }

        try {
          // Describe Subnets
          const subnets = await ec2.describeSubnets({
            Filters: [{ Name: 'vpc-id', Values: [vpc.VpcId] }],
          });

          if (subnets.Subnets && subnets.Subnets.length > 0) {
            const subnet1 = subnets.Subnets.find(a => a.CidrBlock === '10.20.1.0/24' && a.AvailabilityZone === 'us-east-2a');
            const subnet2 = subnets.Subnets.find(b => b.CidrBlock === '10.20.2.0/24' && b.AvailabilityZone === 'us-east-2b');

            try {
              if (subnet1) {
                result[2].weightage = 0.2;
                result[2].status = true;
              } else {
                result[2].error = "Subnet 'us-east-2a' with CIDR '10.20.1.0/24' is not available";
              }
            } catch (error) {
              result[2].error = "VPC 'new-vpc' is not available to validate subnet 'us-east-2a' with CIDR '10.20.1.0/24'";;
            }

            try {
              if (subnet2) {
                result[3].weightage = 0.2;
                result[3].status = true;
              } else {
                result[3].error = "Subnet 'us-east-2b' with CIDR '10.20.2.0/24' is not available";
              }
            } catch (error) {
              result[3].error = "Error checking subnet 'us-east-2b': " + error.message;
            }
          } else {
            result[2].error = "No subnets found in the VPC";
            result[3].error = "No subnets found in the VPC";
          }
        } catch (error) {
            result[2].error = "No subnets found in the VPC";
            result[3].error = "No subnets found in the VPC";
        }

        try {
          // Describe Internet Gateways
          const igws = await ec2.describeInternetGateways({
            Filters: [{ Name: 'attachment.vpc-id', Values: [vpc.VpcId] }],
          });

          if (igws.InternetGateways && igws.InternetGateways.length > 0) {
            const igw = igws.InternetGateways[0];

            if (igw.Attachments && igw.Attachments[0].VpcId === vpc.VpcId) {
              result[4].weightage = 0.2;
              result[4].status = true;

             try {
  // Describe Route Tables
  const routeTables = await ec2.describeRouteTables({
    Filters: [{ Name: 'vpc-id', Values: [vpc.VpcId] }],
  });

  //console.log('Route Tables:', JSON.stringify(routeTables, null, 2));

  if (!vpcData || !vpcData.Vpcs || vpcData.Vpcs.length === 0) {
    result[5].error = "No VPCs found in vpcData";
  } else if (routeTables.RouteTables && routeTables.RouteTables.length > 0) {
    // Iterate through VPCs to find a match
    const matchingVpc = vpcData.Vpcs.find(vpcItem => vpcItem.VpcId === vpc.VpcId);

    if (matchingVpc) {
      // Iterate through Route Tables to find a match
      const matchingRouteTable = routeTables.RouteTables.find(rt => rt.VpcId === matchingVpc.VpcId);

      if (matchingRouteTable) {
        // console.log('Matching Route Table:', JSON.stringify(matchingRouteTable, null, 2));
        result[5].weightage = 0.2;
        result[5].status = true;
      } else {
        result[5].error = "Internet gateway is not added in the route table";
      }
    } else {
      result[5].error = "No matching VPC found in vpcData";
    }
  } else {
    result[5].error = "No route tables found for the VPC";
  }
} catch (error) {
  //console.error('Error describing route tables:', error);
  result[5].error = "VPC 'new-vpc' is not available to validate Internet gateway is added in the route table";
}

            } else {
              result[4].error = "Internet gateway is not attached to 'new-vpc'";
              result[5].error = "Internet gateway is not added in the route table";
            }
          } else {
            result[4].error = "No Internet gateways found for the VPC";
            result[5].error = "No Internet gateways found for the VPC";
          }
        } catch (error) {
          result[4].error = "VPC 'new-vpc' is not available to validate Internet gateway is attached to 'new-vpc'";
          result[5].error = "VPC 'new-vpc' is not available to validate Internet gateway is added in the route table";
        }
      }
    } else {
      result[0].error = "VPC 'new-vpc' is not available";
      result[1].error = "VPC CIDR is not '10.20.0.0/16'";
      result[2].error = "VPC 'new-vpc' is not available to validate subnet 'us-east-2a' with CIDR '10.20.1.0/24'";
      result[3].error = "VPC 'new-vpc' is not available to validate subnet 'us-east-2b' with CIDR '10.20.2.0/24'";
      result[4].error = "VPC 'new-vpc' is not available to validate Internet gateway is attached to 'new-vpc'";
      result[5].error = "VPC 'new-vpc' is not available to validate Internet gateway is added in the route table";
    }

    return result;
  } catch (error) {
    const errorMessage = error.message;
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