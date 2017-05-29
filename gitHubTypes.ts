import { ObjectID } from "mongodb";

export interface EdgePageResponse<T> {
  edges: Edge<T>[]
  pageInfo: {
    endCursor: string
    hasNextPage: boolean
  }
}


export interface Edge<T> {
  node: T
}

export interface GitHubUser {
  company: string
  email: string
  id: string
  isHireable: boolean
  name: string
  websiteUrl: string

  organization: ObjectID
}

export interface Organization {
  members: EdgePageResponse<GitHubUser>
}