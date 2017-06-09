## scripts
```javascript
db.repositories.drop();db.users.drop();db.organizations.drop()


[
  `${db.users.find({login: {$ne: null}}).count()}/${db.users.count()} users`,
  `${db.repositories.find({nameWithOwner: {$ne: null}}).count()}/${db.repositories.count()} repositories`,
  `${db.organizations.find({login: {$ne: null}}).count()}/${db.organizations.count()} organizations`
]

```