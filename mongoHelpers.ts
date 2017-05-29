import { Db } from "mongodb";

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