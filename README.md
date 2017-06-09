## Developer Employer Matcher
*Job recomendations for developers based on their GitHub activity*


Part 1 - Scrape user, organization, and repository metadata from Github into MongoDB. **Complete!**

Part 2 - Perform analysis and ML on data, try to find employment ideas for developers based on interests and location - Not started

Part 3 - Create a web UI for developers and recruiters to see insights - Not started

## Part 1
The script performs a BFS on GitHub GraphQL nodes, including users, repos and organizations. Queries fall into two categories - discovery and details.  Discovery queries just finds the node ids for detail scrapers to use later.

Discovery queries (just fetches ids)
* From an org Id, [find the user Ids of org members](queries/organization-members.graphql)
* From a user Id, [find their repository ids](queries/bulk-repo-lookup-by-user-ids.graphql)
* From a user Id, [find the org ids of organizations they're a member of](queries/bulk-user-membership.graphql).

[Detail queries](queries/node-details.graphql) (given ids, fetch details in bulk)
* From a user id, lookup their handle, company, email, isHireable, name and websiteUrl
* From an org id, lookup their handle and name
* From a repo id, lookup its name and the languages its coded in

Notes
* The BFS is [seeded](data/organizations.txt) with the minimum of one organization Id.
* All queries are saved to .graphql files to get IntelliSense and Node loads them and sends them to GitHubs API when querying data
