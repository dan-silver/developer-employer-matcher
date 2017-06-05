import { Db, ObjectID, InsertWriteOpResult } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository, NodesResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { updateReposDetails } from "../mongoHelpers";

// finds 100 users in DB that don't have repositories field set, finds and creates repos
export let scrapeRepoDetails:GitHubResourceScraperFn = async (db:Db) => {
  let repoCollection = db.collection('repos');
  let reposCursor = repoCollection.find({nameWithOwner:null}).limit(100);

  let repos:Repository[] = await reposCursor.toArray();
  if (repos.length == 0) throw new Error("Can't find repos without details populated");
  
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
  if (mongoRepos.length > 0) await updateReposDetails(db, mongoRepos);
}

async function getRepoDetails(db:Db, repoIds:string[]) {
  if (repoIds.indexOf("MDEwOlJlcG9zaXRvcnk5MjU3OTM3MQ==") != -1) {
    console.log("removing MDEwOlJlcG9zaXRvcnk5MjU3OTM3MQ==")
    repoIds.splice(repoIds.indexOf("MDEwOlJlcG9zaXRvcnk5MjU3OTM3MQ=="), 1);
  }
  return runQuery("repo-lookup-by-ids", {
    repoIds: repoIds
  }).then((res:NodesResponse<GitHubRepository>) => {
    return res.nodes;
  });
}