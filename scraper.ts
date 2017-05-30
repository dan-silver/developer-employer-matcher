import { MongoClient, Db } from 'mongodb'
import { scrapeAllOrganizations } from "./scrapers/org-members";
import { scrapeAllUserRepoLanguages } from "./scrapers/user-repo-languages";

const MongoUrl = 'mongodb://localhost:4000/users';



MongoClient
  .connect(MongoUrl)
  .then(async (db) => {
    await scrapeAllOrganizations(db);
    await scrapeAllUserRepoLanguages(db);
  })






// runQuery("repo-watchers", {
//   org_name: "Microsoft",
//   repo_name: "vscode"
// }).then((res) => {
//   debugger
// });