import { Db, ObjectID } from "mongodb";
import { EdgePageResponse, GitHubUser, Repository } from "./gitHubTypes";

export async function findOrCreateOrganization(db: Db, orgName: string) {
  // @todo, create or find in one operation
  const organizations = db.collection('organizations');
  await organizations.updateOne(
        {"name": orgName},
        {
            "$setOnInsert": {"name": orgName},
        },
        {upsert:true}
    )

  return organizations.findOne({name: orgName})

}

export async function insertUsers(db:Db, users:EdgePageResponse<GitHubUser>) {
    return db.collection('users').insertMany(users.edges.map((edge) => edge.node));
}

export async function insertUserRepos(db:Db, repos:Repository[]) {
    return db.collection('repos').insertMany(repos);
}

export async function updateUserRepos(db:Db, user:GitHubUser, repoIds:ObjectID[]) {
    return db.collection('users').update(
        { _id: user._id },
        {
            $set: {
            repos: repoIds
            }
        }
    ).catch((e) => {
        debugger;
    })
}