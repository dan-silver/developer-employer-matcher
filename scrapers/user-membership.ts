import { Db, ObjectID, InsertWriteOpResult, BulkWriteResult } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository, NodesResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { insertRepos, updateUserRepos, updateUserMembership, insertOrgs } from "../mongoHelpers";

// finds 100 users in DB that don't have repositories field set, finds and creates repos
export let scrapeUserMembership:GitHubResourceScraperFn = async (db:Db) =>  {
  let userCollection = db.collection('users');
  let userCursor = userCollection.find({orgsScraped:null}).limit(100);

  let users:GitHubUser[] = await userCursor.toArray();
  if (users.length == 0) throw new Error("Can't find users without membership details populated");
  let userIds = users.map((user) => user.id);

  let usersWithOrgIds = await getUserMembership(db, userIds);
  for (let user of usersWithOrgIds) {
    let insertedOrgs:BulkWriteResult;
    let userInOrgs = false;
    if (user.organizations.nodes.length != 0) {
      userInOrgs = true;
      insertedOrgs = await insertOrgs(db, user.organizations.nodes as any);
    }

    await updateUserMembership(db, user.id, userInOrgs ? insertedOrgs.getUpsertedIds().map((a:any) => a._id) : []);
    // console.log(`Found ${user.id} has ${userInOrgs ? insertedOrgs.insertedCount : 0} repos`);
  }

  // console.log(`Finished finding repos for batch of ${usersWithRepoData.length} users`)
}

async function getUserMembership(db:Db, userIds:string[]) {
  // if (userIds.indexOf("MDEwOlJlcG9zaXRvcnk5MjU3OTM3MQ==") != -1) {
  //   debugger;
  //   userIds.splice(userIds.indexOf("MDEwOlJlcG9zaXRvcnk5MjU3OTM3MQ=="));
  // }
  return runQuery("bulk-user-membership", {
    userIds: userIds
  }).then((res:NodesResponse<GitHubUser>) => {
    return res.nodes;
  });
}