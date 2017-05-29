import { Db } from "mongodb";
import { EdgePageResponse, GitHubUser } from "./gitHubTypes";

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