// Import the required modules from AWS SDK v3
const { Route53Client, ListHostedZonesCommand, ListResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

// Set the region
const REGION_NAME = 'global'; // Replace with your AWS region
const HOSTED_ZONE_NAME = 'ltimindtree.com';


const result = [
    { weightage: 0, name: `The '${HOSTED_ZONE_NAME}' hosted zone is available`, status: false, error: '' },
    { weightage: 0, name: `The '${HOSTED_ZONE_NAME}' is a Private zone`, status: false, error: '' },
    { weightage: 0, name: `The record with 'host' is available`, status: false, error: '' },
    { weightage: 0, name: `The 'host' record is of type 'AAAA'`, status: false, error: '' },
];
async function checkHostedZone() {
  try {
    // List Hosted Zones
    // Create Route53 service object
    const route53 = new Route53Client({ region: REGION_NAME, credentials, });
    const hostedZonesData = await route53.send(new ListHostedZonesCommand({}));
    const hostedZone = hostedZonesData.HostedZones.find(zone => zone.Name === `${HOSTED_ZONE_NAME}.`);

    if (hostedZone) {
      result[0].status = true;
      result[0].weightage = 0.25;
      try {
        if (hostedZone.Config.PrivateZone === true) {
          result[1].status = true;
          result[1].weightage = 0.25;
        }
        else {
          result[1].error = 'Hosted Zone does not exist to validate private zone';
        }
      }
      catch (error) {
        result[1].error = 'Hosted Zone does not exist to validate private zone';
      }
      // List Resource Record Sets
      const resourceRecordSetsData = await route53.send(new ListResourceRecordSetsCommand({
        HostedZoneId: hostedZone.Id
      }));
      // console.log(resourceRecordSetsData);
      const hostnameRecord = resourceRecordSetsData.ResourceRecordSets.find(r => r.Name === 'host.ltimindtree.com.');
      try {
        if (hostnameRecord) {
          result[2].status = true;
          result[2].weightage = 0.25;
          try {
            if (hostnameRecord.Type === 'AAAA') {
              result[3].status = true;
              result[3].weightage = 0.25;
            }
            else {
              result[3].error = 'Host record does not exist to validate AAAA record type';
            }
          }
          catch (error) {
            result[3].error = 'Host record does not exist to validate AAAA record type';
          }
        } else {
          result[2].error = 'Host record does not exist';
          result[3].error = 'Host record does not exist to validate AAAA record type';
        }
      }
      catch (error) {
        result[2].error = 'Host record does not exist';
        result[3].error = 'Host record does not exist to validate AAAA record type';
      }
    } else {
      result[0].error = 'Hosted Zone does not exist';
      result[1].error = 'Hosted Zone does not exist to validate private zone';
      result[2].error = 'Host record does not exist';
      result[3].error = 'Host record does not exist to validate AAAA record type';
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
  const results = await checkHostedZone();
  console.log(results);
  return results;
}

main();
