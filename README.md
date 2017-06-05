## scripts
```javascript
db.repos.drop();db.users.drop();db.organizations.drop()

[db.repos.count(), db.repos.find({nameWithOwner:null}).count() / db.repos.count() * 100]

```