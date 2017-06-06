const fs = require('fs')

export async function readFileContents(path:string):Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', function (err:any,data:any) {
      if (err) reject(err);
      resolve(data);
    });
  }) 
}

export async function readLineSeparatedFile(fileName:string):Promise<string[]> {
  let fileContents = await readFileContents(fileName);
  return fileContents.split("\n");
}