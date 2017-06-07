import { runQuery } from "../queryHelpers";
import { GitHubOrganization, User, Organization, NodesResponse, EdgePageResponse, GitHubResourceScraperFn, MongoNode } from "../gitHubTypes";
import { setOrgMembers, getUsersByIds, insertShellObjects, setUsersOrganization, nodeCursorToArrayOfNodeIds } from "../mongoHelpers";
import { Db, ObjectID } from "mongodb";
import { readLineSeparatedFile } from "../util";
/**
 * 
 * @todo
 * For each org returned, save the endCursor in mongo for another process to
 * pickup and fetch remaining members
 * 
 */

// Finds all org members, pages through responses and inserts into Mongo
export let scrapeOrgMembers:GitHubResourceScraperFn = async (db:Db) => {
  let orgCursor = db.collection('organizations').find({members:null}).limit(100);

  let orgIds = await nodeCursorToArrayOfNodeIds(orgCursor);

  let pageCursor:string;
  let res = await getOrgsMembershipPage(orgIds, pageCursor);
  for (let org of res.nodes) {
    let orgDbRef:Organization = await db.collection('organizations').findOne({id: org.id});
    let members = org.members.edges.map(u => u.node);
    let insertedUsers = await insertShellObjects(db.collection('users'), members);
    await setUsersOrganization(db, members, orgDbRef);
    await setOrgMembers(db, orgDbRef, insertedUsers.getUpsertedIds().map(((a:any) => a._id)));

  }

  //   if (pageInfo.hasNextPage) {
  //     pageCursor = pageInfo.endCursor;
  //   } else {
  //     console.log(`Finished scraping ${orgs[0].id} members`)
  //     break;
  //   }
  // }
}


async function getOrgsMembershipPage(nodeIds: string[], pageCursor: string) {
  return runQuery<NodesResponse<GitHubOrganization>>("organization-members", {
    nodeIds,
    page_cursor: pageCursor
  });
}