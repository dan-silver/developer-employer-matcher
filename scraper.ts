import { MongoClient, Db } from 'mongodb'
import { scrapeOrgMembers } from "./scrapers/org-members";
import { scrapeUserRepos } from "./scrapers/user-repos";
import { setConstraints, insertShellObjectsFromIds } from "./mongoHelpers";
import { scrapeNodeDetails } from "./scrapers/node-details";
import { GitHubResourceScraperFn } from "./gitHubTypes";
import { readLineSeparatedFile } from "./util";
import { scrapeUserMembership } from "./scrapers/user-membership";
import { MongoUrl } from "./constants";



MongoClient
  .connect(MongoUrl)
  .then(async (db) => {
    await setConstraints(db);

    seedProjectOrganizationIds(db);
    seedLanguageIds(db);

    scrapeGitHubResource(db, scrapeOrgMembers, 10*1000, "Org members");
    scrapeGitHubResource(db, scrapeUserRepos,   10*1000, "User repos");
    scrapeGitHubResource(db, scrapeUserMembership, 5*1000, "User membership");


    // user details
    scrapeGitHubResource(db, () => {
        scrapeNodeDetails(db.collection('users'), "User", {login: null});
      }, 2000, "User details");    
    
    // // repo details
    scrapeGitHubResource(db, () => {
        scrapeNodeDetails(db.collection('repositories'), "Repository", {nameWithOwner: null});
      }, 2000, "Repo details");    

    // // org details
    scrapeGitHubResource(db, () => {
        scrapeNodeDetails(db.collection('organizations'), "Organization", {login: null});
      }, 2000, "organization details");


    // language details
    // scrapeGitHubResource(db, () => {
    //   scrapeNodeDetails(db.collection('languages'), "Language", {name: null});
    // }, 30 * 1000, "language details");

  });

// Helps scrape GitHub Graphql on an interval
// @todo handle rate limiting
function scrapeGitHubResource(db:Db, scraperFn:Function, defaultInterval: number, label: string) {
    let inProgress = false;
    setInterval(async () => {
      if (inProgress == true) {
        console.warn(`${label}: skipping round, request in progress`)
        return;
      }
      inProgress = true;
      console.log(`${label}: starting`)
      try {
        await scraperFn(db);
      } catch(e) {
        console.error(e);
      }
      inProgress = false;
      console.log(`${label}: done`)
    }, defaultInterval);
}

export async function seedProjectOrganizationIds(db:Db) {
  let orgIds = await readLineSeparatedFile(`data/organizations.txt`);
  await insertShellObjectsFromIds(db.collection('organizations'), orgIds);
}

export async function seedLanguageIds(db:Db) {
    let ids = await db.collection('repositories').distinct("languages.nodes", null);
    await insertShellObjectsFromIds(db.collection('languages'), ids);
}