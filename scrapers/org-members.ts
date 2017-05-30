import { runQuery } from "../queryHelpers";
import { Organization } from "../gitHubTypes";
import { findOrCreateOrganization, insertUsers } from "../mongoHelpers";
import { Db } from "mongodb";
import { readLineSeparatedFile } from "../util";

export async function getOrgMembersPage(orgName: string, organizationId: any, pageCursor: string) {
  return runQuery("organization-members", {
    org_name: orgName,
    page_cursor: pageCursor
  }).then((res) => {
    let org:Organization = res.organization;
    for (let member of org.members.edges) {
      member.node.organization = organizationId;
    }

    return org.members; 
  });
}

// Finds all org members, pages through responses and inserts into Mongo
async function scrapeOrgMembers(db:Db, orgName:string) {
  let organization = await findOrCreateOrganization(db, orgName);

  let pageCursor:string;
  while (true) {
    let orgMembersPage = await getOrgMembersPage(orgName, organization._id, pageCursor);    
    await insertUsers(db, orgMembersPage);

    if (orgMembersPage.pageInfo.hasNextPage) {
      pageCursor = orgMembersPage.pageInfo.endCursor;
    } else {
      console.log(`Finished scraping ${orgName} members`)
      break;
    }
  }
}

export async function scrapeAllOrganizations(db:Db) {
  let orgNames = await readLineSeparatedFile(`data/organizations.txt`);
  for (let org of orgNames) {
    await scrapeOrgMembers(db, org);
  }
}