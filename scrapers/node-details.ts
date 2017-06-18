import { Db, Collection, Cursor } from "mongodb";
import { GitHubUser, NodesResponse, GitHubResourceScraperFn, User, NodeType, GitHubNode, MongoNode, Repository, GitHubRepository } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { updateMongoNodeDetails, nodeCursorToArrayOfNodeIds } from "../mongoHelpers";

// finds 100 nodes in DB that don't have field set, finds and updates them
export let scrapeNodeDetails = async (collection:Collection, nodeType:NodeType, nodeIsEmptyQuery:any) => {

  let nodeCursor = collection.find(nodeIsEmptyQuery).limit(100);
  
  let nodeIds = await nodeCursorToArrayOfNodeIds(nodeCursor);
  if (nodeIds.length == 0) {
    console.warn(`No ${collection.collectionName} nodes found to lookup details`)
    return;
  }
  
  let nodeDetails;
  try {
    nodeDetails = await runQuery<NodesResponse<GitHubNode>>("node-details", { nodeIds });
  } catch(e) {
    debugger;
  }
  if (!nodeDetails) {
    console.error("Can't find node details for " + collection.collectionName);
    return;
  }
  // convert raw data from GitHub to mongo schema
  let nodes:MongoNode[] = convertGitHubNodesToMongo(nodeDetails.nodes, nodeType);
  if (nodes.length > 0) await updateMongoNodeDetails(collection, nodes);
}

export function convertGitHubNodesToMongo(nodes:GitHubNode[], nodeType:NodeType):MongoNode[] {
  if (nodeType == "Repository") {
    return nodes.map((raw:GitHubRepository) => {
      return {
        id: raw.id,
        languages: raw.languages.nodes.map((lang) => lang.id),
        nameWithOwner: raw.nameWithOwner,
        primaryLanguage: raw.primaryLanguage ? raw.primaryLanguage.id: null,
        createdAt: new Date(raw.createdAt),
        pushedAt: new Date(raw.pushedAt)

      } as Repository
    });
  } else {
    return nodes;
  }
}