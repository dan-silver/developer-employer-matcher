import { Db, Collection, Cursor, MongoClient, ObjectID } from "mongodb";
import { MongoUrl } from "../constants";
import { Organization, User, Repository, Language } from "../gitHubTypes";

MongoClient
  .connect(MongoUrl)
  .then(async (db) => {
    let allLanguages:Language[] = await db.collection('languages').find().toArray();

    let langIdNameMap:any = {};

    for (let lang of allLanguages) {
      langIdNameMap[lang.id] = lang.name;
    }

    let headers = ["company"];
    headers = headers.concat(allLanguages.map(l=>l.name));

    function convertLangIdToName(langId:string):string {
      return langIdNameMap[langId];
    }

    let fs = require('fs');
    var csvWriter = require('csv-write-stream');
    var writer = csvWriter({headers: headers})
    writer.pipe(fs.createWriteStream('data.csv'))

    let organizations = db.collection('organizations').find<Organization>();//{name: "Microsoft"});

    while (await organizations.hasNext()) {
      let org:Organization = await organizations.next();

      if (!org.members) continue;
      for (let userId of org.members) {
        let user:User = await db.collection('users').findOne(userId);
        let userInterests = new UserInterestsCount();

        if (!user.repositories) continue;
        for (let repoId of user.repositories) {
          let repo = await db.collection('repositories').findOne(repoId);

          // console.log(repo)
          if (!repo.languages) continue;
          for (let language of repo.languages) {
            userInterests.incrementInterest(convertLangIdToName(language));
          }
        }

        if (Object.keys(userInterests.interests).length > 0 && user.company) {
          let dataPoint = {company:user.company};
          dataPoint = Object.assign(dataPoint, userInterests.interests);
          writer.write(dataPoint)
        }
      }
    }

    writer.end();


  });



class UserInterestsCount {
  interests:{[language:string]:number} = {}; // language: count

  incrementInterest(language:string) {
    if (language in this.interests) this.interests[language]++;
    else this.interests[language] = 1;
  }
}