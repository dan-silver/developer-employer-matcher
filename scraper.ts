import { MongoClient, Db } from 'mongodb'
import { scrapeOrgMembers } from "./scrapers/org-members";
import { scrapeUserRepos } from "./scrapers/user-repos";
import { setConstraints, insertShellObjects } from "./mongoHelpers";
import { scrapeRepoDetails } from "./scrapers/repo-details";
import { GitHubResourceScraperFn } from "./gitHubTypes";
import { readLineSeparatedFile } from "./util";
import { scrapeUserMembership } from "./scrapers/user-membership";

const MongoUrl = 'mongodb://localhost:4000/users';

MongoClient
  .connect(MongoUrl)
  .then(async (db) => {
    await setConstraints(db);

    seedProjectOrganizationIds(db);

    scrapeGitHubResource(db, scrapeOrgMembers, 2000, "Org members");
    scrapeGitHubResource(db, scrapeUserRepos,   2000, "User repos");
    scrapeGitHubResource(db, scrapeRepoDetails, 2000, "Repo details");
    scrapeGitHubResource(db, scrapeUserMembership, 2000, "User membership");
  });

// Helps scrape GitHub Graphql on an interval
// @todo handle rate limiting
function scrapeGitHubResource(db:Db, scraperFn:GitHubResourceScraperFn, defaultInterval: number, label: string) {
    let inProgress = false;
    setInterval(async () => {
      if (inProgress == true) {
        console.warn(`${label}: skipping round`)
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