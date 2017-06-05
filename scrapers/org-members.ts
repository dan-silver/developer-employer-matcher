import { runQuery } from "../queryHelpers";
import { Organization, User } from "../gitHubTypes";
import { findOrCreateOrganization, insertUsers } from "../mongoHelpers";
import { Db } from "mongodb";
import { readLineSeparatedFile } from "../util";

export async function getOrgMembersPage(orgName: string, organizationId: any, pageCursor: string) {
  return runQuery("organization-members", {
    org_name: orgName,
    page_cursor: pageCursor
  }).then((res) => {
    let users:User[] = [];

    let org:Organization = res.organization;
    
    for (let member of org.members.edges) {
      users.push({
        name:         member.node.name,
        login:        member.node.login,
        company:      member.node.company,
        email:        member.node.email,
        id:           member.node.id,
        isHireable:   member.node.isHireable,
        websiteUrl:   member.node.websiteUrl,
        organization: organizationId
      });
    }

    return {pageInfo: org.members.pageInfo, users}; 
  });
}

// Finds all org members, pages through responses and inserts into Mongo
async function scrapeOrgMembers(db:Db, orgName:string) {
  let organization = await findOrCreateOrganization(db, orgName);

  let pageCursor:string;
  while (true) {
    let {pageInfo, users} = await getOrgMembersPage(orgName, organization._id, pageCursor);    
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