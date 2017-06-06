import { runQuery } from "../queryHelpers";
import { GitHubOrganization, User, Organization, NodesResponse, EdgePageResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { findOrCreateOrganization, insertUsers, setOrgMembers, getUsersByIds } from "../mongoHelpers";
import { Db, ObjectID } from "mongodb";
import { readLineSeparatedFile } from "../util";

async function getOrgMembersPage(orgId: string, organizationId: ObjectID, pageCursor: string) {  
  return runQuery("organization-members", {
    orgIds: [orgId],
    page_cursor: pageCursor
  }).then((res:NodesResponse<GitHubOrganization>) => {

    let users:User[] = [];
    for (let member of res.nodes[0].members.edges) {
      users.push({
        id: member.node.id,
        organizations: [organizationId]
      });
    }

    return {pageInfo: res.nodes[0].members.pageInfo, users}; 
  });
}

// Finds all org members, pages through responses and inserts into Mongo
export let scrapeOrgMembers:GitHubResourceScraperFn = async (db:Db) => {
  let orgCollection = db.collection('organizations');
  let orgCursor = orgCollection.find({members:null}).limit(1);

  let orgs:Organization[] = await orgCursor.toArray();
  if (orgs.length == 0) throw new Error("Can't find orgs without members populated");
  
  // let orgId = orgs.map((org) => org.id);

  let pageCursor:string;
  while (true) {
    let {pageInfo, users} = await getOrgMembersPage(orgs[0].id, orgs[0]._id, pageCursor);    
    await insertUsers(db, users);
    let insertedUsers:User[] = await (await getUsersByIds(db, users.map(u => u.id))).toArray();
    await setOrgMembers(db, orgs[0], insertedUsers.map(u => u._id));

    if (pageInfo.hasNextPage) {
      pageCursor = pageInfo.endCursor;
    } else {
      console.log(`Finished scraping ${orgs[0].id} members`)
      break;
    }
  }
}