import { Db, ObjectID, InsertWriteOpResult, BulkWriteResult } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository, NodesResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { updateUserMembership, insertShellObjects, nodeCursorToArrayOfNodeIds } from "../mongoHelpers";

// finds 100 users in DB that don't have organizations field set, finds and creates repos
export let scrapeUserMembership:GitHubResourceScraperFn = async (db:Db) =>  {
  let userCursor = db.collection('users').find({orgsScraped:null}).limit(100);

  let userIds = await nodeCursorToArrayOfNodeIds(userCursor);

  let usersWithOrgIds = await getUserMembership(db, userIds);
  for (let user of usersWithOrgIds.nodes) {
    let insertedOrgs:BulkWriteResult;
    if (user.organizations.nodes.length != 0) {
      insertedOrgs = await insertShellObjects(db.collection('organizations'), user.organizations.nodes as any);
    }

    await updateUserMembership(db, user.id, insertedOrgs ? insertedOrgs.getUpsertedIds().map((a:any) => a._id) : []);
  }
}

async function getUserMembership(db:Db, nodeIds:string[]) {
  return runQuery<NodesResponse<GitHubUser>>("bulk-user-membership", { nodeIds });
}