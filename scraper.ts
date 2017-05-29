import { runQuery } from "./queryHelpers";

import { MongoClient, Db } from 'mongodb'
import { Edge, GitHubUser, EdgePageResponse, Organization } from "./gitHubTypes";
import { findOrCreateOrganization, insertUsers } from "./mongoHelpers";
import { readFileContents } from "./util";

const MongoUrl = 'mongodb://localhost:4000/users';

async function getOrgMembersPage(orgName:string, organizationId:any, pageCursor:string) {
  return runQuery("organization-members", {
    org_name: orgName,
    page_cursor: pageCursor
  }).then((res) => {
    let org:Organization = res.organization;
    for (let userEdge of org.members.edges) {
      userEdge.node.organization = organizationId;
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

async function scrapeAllOrganizations(db:Db) {
  let orgListRawTxt = await readFileContents(`data/organizations.txt`);
  let orgNames = orgListRawTxt.split("\n");
  for (let org of orgNames) {
    await scrapeOrgMembers(db, org);
  }
}

MongoClient
  .connect(MongoUrl)
  .then(scrapeAllOrganizations)






// runQuery("repo-watchers", {
//   org_name: "Microsoft",
//   repo_name: "vscode"
// }).then((res) => {
//   debugger
// });