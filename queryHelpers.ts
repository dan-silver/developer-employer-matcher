import * as request from 'superagent';
import { secrets } from './secrets'
const fs = require('fs')

async function executeQuery(query:string, substitutions?:any) {
  return request
    .post("https://api.github.com/graphql")
    .set("Authorization", `bearer ${secrets.accessToken}`)
    .set('content-type', 'application/json')
    .send({
      query: query,
      variables: substitutions
    })
}

async function getQuery(name:string):Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(`./queries/${name}.graphql`, 'utf8', function (err:any,data:string) {
      if (err)reject(err);
      resolve(data);
    });
  })
}

export async function runQuery(queryName:string, queryVariables:any) {
  return getQuery(queryName)
    .then((queryContents) => {
      return executeQuery(queryContents, queryVariables)
    })
    .then((queryResults) => {
      return queryResults.body.data;
    });
}