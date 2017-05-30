import * as request from 'superagent';
import { AccessToken } from './secrets'
import { readFileContents } from "./util";

async function executeQuery(query:string, substitutions?:any) {
  return request
    .post("https://api.github.com/graphql")
    .set("Authorization", `bearer ${AccessToken}`)
    .set('content-type', 'application/json')
    .send({
      query: query,
      variables: substitutions
    })
}


async function getQuery(name:string):Promise<any> {
  return readFileContents(`./queries/${name}.graphql`);
}

export async function runQuery(queryName:string, queryVariables:any) {
  return getQuery(queryName)
    .then((queryContents) => {
      return executeQuery(queryContents, queryVariables)
    })
    .then((queryResults) => {
      if (queryResults.body.errors) {
        throw queryResults.body.errors;
      }
      return queryResults.body.data;
    })
    .catch((e) => {
      debugger;
    })
}