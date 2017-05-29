import { runQuery } from "./queryHelpers";

runQuery("organization-members", {
  org_name: "Microsoft"
}).then((res) => {
  debugger
});

runQuery("repo-watchers", {
  org_name: "Microsoft",
  repo_name: "vscode"
}).then((res) => {
  debugger
});