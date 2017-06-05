import { runQuery } from "../queryHelpers";
import { GitHubOrganization, User, Organization } from "../gitHubTypes";
import { findOrCreateOrganization, insertUsers } from "../mongoHelpers";
import { Db } from "mongodb";
import { readLineSeparatedFile } from "../util";

export async function getOrgMembersPage(orgName: string, organizationId: any, pageCursor: string) {
  return runQuery("organization-members", {
    org_name: orgName,
    page_cursor: pageCursor
  }).then((res) => {
    let org:GitHubOrganization = res.organization;
    
    let users:User[] = [];
    for (let member of org.members.edges) {
      users.push({
        id: member.node.id,
        organizations: [organizationId]
      });
    }

    return {pageInfo: org.members.pageInfo, users}; 
  });
}

// Finds all org members, pages through responses and inserts into Mongo
async function scrapeOrgMembers(db:Db, orgName:string) {
  let org = await findOrCreateOrganization(db, orgName);

  let pageCursor:string;
  while (true) {
    let {pageInfo, users} = await getOrgMembersPage(orgName, org._id, pageCursor);    
    await insertUsers(db, users);

    if (pageInfo.hasNextPage) {
      pageCursor = pageInfo.endCursor;
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