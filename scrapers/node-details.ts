import { Db, Collection, Cursor } from "mongodb";
import { GitHubUser, NodesResponse, GitHubResourceScraperFn, User } from "../gitHubTypes";
import { runQuery } from "../queryHelpers";
import { updateMongoNodeDetails, nodeCursorToArrayOfNodeIds } from "../mongoHelpers";

// finds 100 nodes in DB that don't have field set, finds and updates them
export let scrapeNodeDetails = async (collection:Collection, nodeIsEmptyQuery:any) => {

  let nodeCursor = collection.find(nodeIsEmptyQuery).limit(100);
  
  let nodeIds = await nodeCursorToArrayOfNodeIds(nodeCursor);
  if (nodeIds.length == 0) {
    console.warn(`No ${collection.collectionName} nodes found to lookup details`)
    return;
  }
  

  let nodeDetails = await runQuery<NodesResponse<any>>("node-details", { nodeIds });
  if (!nodeDetails) {
    console.error("Can't find node details for " + collection.collectionName);
    return;
  }
  // convert raw data from GitHub to mongo schema
  let nodes = nodeDetails.nodes;
  if (nodes.length > 0) await updateMongoNodeDetails(collection, nodes);
}