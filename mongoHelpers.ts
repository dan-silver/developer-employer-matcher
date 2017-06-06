import { Db, ObjectID } from "mongodb";
import { EdgePageResponse, GitHubUser, Repository, User, Organization } from "./gitHubTypes";

export async function getUsersByIds(db: Db, ids: string[]) {
    return db.collection('users').find({id: {$in: ids}});
}

export async function findOrCreateOrganization(db: Db, orgId: string):Promise<Organization> {
  // @todo, create or find in one operation
  const organizations = db.collection('organizations');
  await organizations.updateOne(
        {"id": orgId},
        {
            "$setOnInsert": {"id": orgId},
        },
        {upsert:true}
    )

  return organizations.findOne({name: orgId})

}

export async function insertUsers(db:Db, users:User[]) {
    let bulkOp = db.collection('users').initializeUnorderedBulkOp();
    for (let user of users)
        bulkOp.find( {id: user.id} ).upsert().update( { $addToSet: {organizations: {$each: user.organizations}} } );
    return bulkOp.execute();

    // return db.collection('users').insertMany(users);
}

export async function setOrgMembers(db:Db, org:Organization, userIds: ObjectID[]) {
    return db.collection('organizations').updateOne( {_id: org._id},
        { $addToSet: {members: {$each: userIds}} } );

}


// combine with insertOrgs to insertShellObject<T>
export async function insertRepos(db:Db, repos:Repository[]) {
    let bulkOp = db.collection('repos').initializeUnorderedBulkOp();
    for (let repo of repos)
        bulkOp.find( {id: repo.id} ).upsert().update( { $set: {id: repo.id} } );
    return bulkOp.execute();

    // return db.collection('repos').insertMany(repos);
}

export async function insertOrgs(db:Db, orgs:Organization[]) {
    let bulkOp = db.collection('organizations').initializeUnorderedBulkOp();
    for (let org of orgs)
        bulkOp.find( {id: org.id} ).upsert().update( { $set: {id: org.id} } );
    return bulkOp.execute();
}

export async function updateUserMembership(db:Db, gitHubUserId:string, repoIds:ObjectID[]) {
    return db.collection('users').update(
        { id: gitHubUserId },
        {
            $addToSet: {
                organizations: {$each: repoIds}
            },
            $set: {
                orgsScraped: true
            }
        }
    ).catch((e) => {
        debugger;
    })
}


export async function updateUserRepos(db:Db, gitHubUserId:string, repoIds:ObjectID[]) {
    return db.collection('users').update(
        { id: gitHubUserId },
        {
            $addToSet: {
                repos: {$each: repoIds}
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
    await db.collection('organizations').createIndex( { "id": 1 }, { unique: true } )
}