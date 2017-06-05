import { Db, ObjectID } from "mongodb";
import { EdgePageResponse, GitHubUser, Repository, User } from "./gitHubTypes";

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

export async function insertUsers(db:Db, users:User[]) {
    let bulkOp = db.collection('users').initializeUnorderedBulkOp();
    for (let user of users)
        bulkOp.find( {id: user.id} ).upsert().update( { $set: user } );
    return bulkOp.execute();

    // return db.collection('users').insertMany(users);
}

export async function insertRepos(db:Db, repos:Repository[]) {
    return db.collection('repos').insertMany(repos);
}

export async function updateUserRepos(db:Db, gitHubUserId:string, repoIds:ObjectID[]) {
    return db.collection('users').update(
        { id: gitHubUserId },
        {
            $set: {
                repos: repoIds
            }
        }
    ).catch((e) => {
        debugger;
    })
}

export async function updateReposDetails(db:Db, repos:Repository[]) {
    let bulkOp = db.collection('repos').initializeUnorderedBulkOp();
    for (let repo of repos)
        bulkOp.find( {id: repo.id} ).update( { $set: repo } );
    return bulkOp.execute();
}


export async function setConstraints(db:Db) {
    await db.collection('users').createIndex( { "id": 1 }, { unique: true } )
    await db.collection('repos').createIndex( { "id": 1 }, { unique: true } )
}