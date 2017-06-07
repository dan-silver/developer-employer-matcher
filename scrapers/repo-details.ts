import { Db, ObjectID, InsertWriteOpResult } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository, NodesResponse, GitHubResourceScraperFn } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { updateMongoNodeDetails, nodeCursorToArrayOfNodeIds } from "../mongoHelpers";

// finds 100 users in DB that don't have repositories field set, finds and creates repos
export let scrapeRepoDetails:GitHubResourceScraperFn = async (db:Db) => {
  let reposCursor = db.collection('repositories').find({nameWithOwner:null}).limit(100);
  
  let repoIds = await nodeCursorToArrayOfNodeIds(reposCursor);

  let repoDetails = await getRepoDetails(db, repoIds);
  // convert raw data from GitHub to mongo schema
  let mongoRepos:Repository[] = [];
  for (let repo of repoDetails.nodes) {
    mongoRepos.push({
      id: repo.id,
      languages: repo.languages.nodes.map(lang => lang.id),
      nameWithOwner: repo.nameWithOwner,
      primaryLanguage: repo.primaryLanguage ? repo.primaryLanguage.id : null
    })
  }
  if (mongoRepos.length > 0) await updateMongoNodeDetails(db, 'repositories', mongoRepos);
}

async function getRepoDetails(db:Db, nodeIds:string[]) {
  return runQuery<NodesResponse<GitHubRepository>>("repo-lookup-by-ids", { nodeIds });
}