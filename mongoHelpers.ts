import { Db, ObjectID, Collection, Cursor } from "mongodb";
import { EdgePageResponse, GitHubUser, Repository, User, Organization, MongoNode } from "./gitHubTypes";

export async function getUsersByIds(db: Db, ids: string[]) {
    return db.collection('users').find({id: {$in: ids}});
}

export async function setOrgMembers(db:Db, org:Organization, userIds: ObjectID[]) {
    return db.collection('organizations').updateOne( {_id: org._id},
        { $addToSet: {members: {$each: userIds}} } );

}

export async function insertShellObjects(collection:Collection, objects:MongoNode[]) {
    let bulkOp = collection.initializeUnorderedBulkOp();
    for (let object of objects)
        bulkOp.find( {id: object.id} ).upsert().update( { $set: {id: object.id} } );
    return bulkOp.execute();
}

export async function setUsersOrganization(db:Db, users:User[], organization:Organization) {
    return db.collection('users').update({id: {$in: users.map(u=>u.id)}},
        { $addToSet: {organizations: organization} } );
}

export async function updateUserMembership(db:Db, gitHubUserId:string, orgIds:ObjectID[]) {
    return db.collection('users').update(
        { id: gitHubUserId },
        {
            $addToSet: {
                organizations: {$each: orgIds}
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
                repositories: {$each: repoIds}
            }
        }
    ).catch((e) => {
        debugger;
    })
}

export async function updateMongoNodeDetails(db:Db, collectionName:string, nodes:MongoNode[]) {
    let bulkOp = db.collection(collectionName).initializeUnorderedBulkOp();
    for (let node of nodes)
        bulkOp.find( {id: node.id} ).update( { $set: node } );
    return bulkOp.execute();
}


export async function setConstraints(db:Db) {
    await db.collection('users').createIndex( { "id": 1 }, { unique: true } )
    await db.collection('repositories').createIndex( { "id": 1 }, { unique: true } )
    await db.collection('organizations').createIndex( { "id": 1 }, { unique: true } )
}

export async function nodeCursorToArrayOfNodeIds(startingNodes:Cursor<MongoNode>) {
    let nodes = await startingNodes.toArray();
    if (nodes.length == 0) throw new Error("Can't find nodes");
    let nodeIds = nodes.map(nodes => nodes.id);
    return nodeIds;
}
