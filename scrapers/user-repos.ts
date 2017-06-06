import { Db, ObjectID, InsertWriteOpResult, BulkWriteResult } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository, NodesResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { insertShellObjects, updateUserRepos } from "../mongoHelpers";

// finds 100 users in DB that don't have repositories field set, finds and creates repos
export let scrapeUserRepos:GitHubResourceScraperFn = async (db:Db) =>  {
  let userCollection = db.collection('users');
  let userCursor = userCollection.find({repos:null}).limit(100);

  let users:GitHubUser[] = await userCursor.toArray();
  if (users.length == 0) throw new Error("Can't find users without repo details populated");
  let userIds = users.map((user) => user.id);

  let usersWithRepoIds = await getUsersRepos(db, userIds);
  for (let user of usersWithRepoIds) {
    let insertedRepos:BulkWriteResult;
    if (user.repositories.nodes.length != 0) {
      insertedRepos = await insertShellObjects(db.collection('repos'), user.repositories.nodes as any);
    }

    await updateUserRepos(db, user.id, insertedRepos ? insertedRepos.getUpsertedIds().map((a:any) => a._id) : []);
  }
}

async function getUsersRepos(db:Db, userIds:string[]) {
  if (userIds.indexOf("MDEwOlJlcG9zaXRvcnk5MjU3OTM3MQ==") != -1) {
    debugger;
    userIds.splice(userIds.indexOf("MDEwOlJlcG9zaXRvcnk5MjU3OTM3MQ=="));
  }
  return runQuery("bulk-repo-lookup-by-user-ids", {
    userIds: userIds
  }).then((res:NodesResponse<GitHubUser>) => {
    return res.nodes;
  });
}