import { Db, BulkWriteResult } from "mongodb";
import { GitHubUser, NodesResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { insertShellObjects, updateUserRepos, nodeCursorToArrayOfNodeIds } from "../mongoHelpers";

// finds 100 users in DB that don't have repositories field set, finds and creates repos
export let scrapeUserRepos:GitHubResourceScraperFn = async (db:Db) =>  {
  let userCursor = db.collection('users').find({repositories:null}).limit(100);

  let userIds = await nodeCursorToArrayOfNodeIds(userCursor);

  let usersWithRepoIds = await getUsersRepos(db, userIds);
  for (let user of usersWithRepoIds.nodes) {
    let insertedRepos:BulkWriteResult;
    if (user.repositories.nodes.length != 0) {
      insertedRepos = await insertShellObjects(db.collection('repositories'), user.repositories.nodes as any);
    }

    await updateUserRepos(db, user.id, insertedRepos ? insertedRepos.getUpsertedIds().map((a:any) => a._id) : []);
  }
}

async function getUsersRepos(db:Db, nodeIds:string[]) {
  return runQuery<NodesResponse<GitHubUser>>("bulk-repo-lookup-by-user-ids", { nodeIds });
}