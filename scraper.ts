import { MongoClient, Db } from 'mongodb'
import { scrapeAllOrganizations } from "./scrapers/org-members";
import { scrapeUserRepos } from "./scrapers/user-repos";
import { setConstraints } from "./mongoHelpers";
import { scrapeRepoDetails } from "./scrapers/repo-details";
import { GitHubResourceScraperFn } from "./gitHubTypes";

const MongoUrl = 'mongodb://localhost:4000/users';

MongoClient
  .connect(MongoUrl)
  .then(async (db) => {
    // await setConstraints(db);

    // await scrapeAllOrganizations(db);

    scrapeGitHubResource(db, scrapeUserRepos,   2000, "User repos");
    scrapeGitHubResource(db, scrapeRepoDetails, 2000, "Repo details");
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