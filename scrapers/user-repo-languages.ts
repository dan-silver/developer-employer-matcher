import { Db, ObjectID } from "mongodb";
import { GitHubUser, EdgeResponse, GitHubRepository, Repository } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { insertUserRepos, updateUserRepos } from "../mongoHelpers";

export async function scrapeAllUserRepoLanguages(db: Db) {
    // for each user
      // see if we have their repos
      // if not, find them
  let userCollection = db.collection('users');
  let userCursor = userCollection.find();

  while (await userCursor.hasNext()) {

    if (userCursor.isClosed()) {
      debugger;
      console.log("cursor closed, exiting")
      break;
    }
    let user:GitHubUser = await userCursor.next()

    if (!user) {
      console.log("Skipping null user");
      continue;
    }

    if (!user.repositories) {
      let repos = await getUserReposWithLanguages(db, user);
      if (repos && repos.length > 0) {
        let insertedRepos = await insertUserRepos(db, repos);
        await updateUserRepos(db, user, insertedRepos.insertedIds);
        console.log(`Found ${user.login} has ${repos.length} repos`);
      }
    }
  }
  console.log("Finished iterating through user collection")
}

async function getUserReposWithLanguages(db:Db, user:GitHubUser) {
  return runQuery("fetch-user-repo-languages", {
    user_name: user.login
  }).then((res) => {
    if (!res) return null;

    let userRepos:EdgeResponse<GitHubRepository> = res.user.repositories;
    let repos:Repository[] = [];

    // map an api response to the mongo repo object

    for (let repo of userRepos.edges) {
      let cleanedRepo:Repository = {
        nameWithOwner: repo.node.nameWithOwner,
        languages: repo.node.languages.nodes.map((node) => node.id),
        primaryLanguage: repo.node.primaryLanguage ? repo.node.primaryLanguage.id : null
      }
      repos.push(cleanedRepo);
    }
    return repos;
  });
}