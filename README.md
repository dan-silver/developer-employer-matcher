## scripts
```javascript
db.repositories.drop();db.users.drop();db.organizations.drop()

[db.repositories.count(), db.repositories.find({nameWithOwner:null}).count() / db.repositories.count() * 100]

```