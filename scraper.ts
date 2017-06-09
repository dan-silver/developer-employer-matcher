import { MongoClient, Db } from 'mongodb'
import { scrapeOrgMembers } from "./scrapers/org-members";
import { scrapeUserRepos } from "./scrapers/user-repos";
import { setConstraints, insertShellObjects } from "./mongoHelpers";
import { scrapeNodeDetails } from "./scrapers/node-details";
import { GitHubResourceScraperFn } from "./gitHubTypes";
import { readLineSeparatedFile } from "./util";
import { scrapeUserMembership } from "./scrapers/user-membership";

const MongoUrl = 'mongodb://localhost:4000/users';

MongoClient
  .connect(MongoUrl)
  .then(async (db) => {
    await setConstraints(db);

    seedProjectOrganizationIds(db);

    scrapeGitHubResource(db, scrapeOrgMembers, 10*1000, "Org members");
    scrapeGitHubResource(db, scrapeUserRepos,   10*1000, "User repos");
    scrapeGitHubResource(db, scrapeUserMembership, 10*1000, "User membership");


    // user details
    scrapeGitHubResource(db, () => {
        scrapeNodeDetails(db.collection('users'), {login: null});
      }, 2000, "User details");    
    
    // repo details
    scrapeGitHubResource(db, () => {
        scrapeNodeDetails(db.collection('repositories'), {nameWithOwner: null});
      }, 2000, "Repo details");    

    // org details
    scrapeGitHubResource(db, () => {
        scrapeNodeDetails(db.collection('organizations'), {login: null});
      }, 2000, "organization details");    



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
    }, 1000 * 2);
}

export async function seedProjectOrganizationIds(db:Db) {
  let orgIds = await readLineSeparatedFile(`data/organizations.txt`);
  await insertShellObjects(db.collection('organizations'), orgIds.map(id => {return {id}}));
}