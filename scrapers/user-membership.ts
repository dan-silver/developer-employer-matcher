import { Db, ObjectID, InsertWriteOpResult, BulkWriteResult } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository, NodesResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { updateUserRepos, updateUserMembership, insertShellObjects } from "../mongoHelpers";

// finds 100 users in DB that don't have organizations field set, finds and creates repos
export let scrapeUserMembership:GitHubResourceScraperFn = async (db:Db) =>  {
  let userCollection = db.collection('users');
  let userCursor = userCollection.find({orgsScraped:null}).limit(100);

  let users:GitHubUser[] = await userCursor.toArray();
  if (users.length == 0) throw new Error("Can't find users without membership details populated");
  let userIds = users.map((user) => user.id);

  let usersWithOrgIds = await getUserMembership(db, userIds);
  for (let user of usersWithOrgIds.nodes) {
    let insertedOrgs:BulkWriteResult;
    if (user.organizations.nodes.length != 0) {
      insertedOrgs = await insertShellObjects(db.collection('organizations'), user.organizations.nodes as any);
    }

    await updateUserMembership(db, user.id, insertedOrgs ? insertedOrgs.getUpsertedIds().map((a:any) => a._id) : []);
  }
}

async function getUserMembership(db:Db, userIds:string[]):Promise<NodesResponse<GitHubUser>> {
  return runQuery("bulk-user-membership", { userIds });
}