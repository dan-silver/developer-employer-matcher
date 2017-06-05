import { Db, ObjectID, InsertWriteOpResult } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository, NodesResponse } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { updateReposDetails } from "../mongoHelpers";

// finds 100 users in DB that don't have repositories field set, finds and creates repos
export async function scrapeRepoDetails(db: Db) {
  let repoCollection = db.collection('repos');
  let reposCursor = repoCollection.find({nameWithOwner:null}).limit(100);

  let repos:Repository[] = await reposCursor.toArray();
  let repoIds = repos.map((repo) => repo.id);
  let repoDetails = await getRepoDetails(db, repoIds);
  // convert raw data from GitHub to mongo schema
  let mongoRepos:Repository[] = [];
  for (let repo of repoDetails) {
    mongoRepos.push({
      id: repo.id,
      languages: repo.languages.nodes.map((lang) => lang.id),
      nameWithOwner: repo.nameWithOwner,
      primaryLanguage: repo.primaryLanguage ? repo.primaryLanguage.id : null
    })
  }
  await updateReposDetails(db, mongoRepos);
}

async function getRepoDetails(db:Db, repoIds:string[]) {
  return runQuery("repo-lookup-by-ids", {
    repoIds: repoIds
  }).then((res:NodesResponse<GitHubRepository>) => {
    return res.nodes;
  });
}