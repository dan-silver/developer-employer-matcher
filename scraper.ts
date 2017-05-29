import { runQuery } from "./queryHelpers";

import { MongoClient } from 'mongodb'
import { Edge, GitHubUser } from "./gitHubTypes";
import { findOrCreateOrganization } from "./mongoHelpers";
import { readFileContents } from "./util";

const MongoUrl = 'mongodb://localhost:4000/users';

async function scrapeOrgMembers(orgName:string) {
  let db = await MongoClient.connect(MongoUrl);
  let organization = await findOrCreateOrganization(db, orgName);

  return runQuery("organization-members", {
    org_name: orgName
  }).then((res) => {
    let userEdges:Edge<GitHubUser>[] = res.organization.members.edges;
    let users = [];
    for (let userEdge of userEdges) {
      const user = userEdge.node;
      user.organization = organization._id;
      users.push(user);
    }
    return db.collection('users').insertMany(users);
  });
}


// runQuery("repo-watchers", {
//   org_name: "Microsoft",
//   repo_name: "vscode"
// }).then((res) => {
//   debugger
// });




async function scrapeAllOrganizations() {
  let orgListRawTxt = await readFileContents(`data/organizations.txt`);
  let orgNames = orgListRawTxt.split("\n");
  for (let org of orgNames) {
    await scrapeOrgMembers(org);
  }
}


scrapeAllOrganizations();