import { ObjectID } from "mongodb";

export interface EdgeResponse<T> {
  edges: Edge<T>[]
}

export interface PageInfo {
  endCursor: string
  hasNextPage: boolean
}

export interface EdgePageResponse<T> extends EdgeResponse<T> {
  pageInfo: PageInfo
}

export interface GitHubLanguage {
  id: string
  name: string
}

export interface Edge<T> {
  node: T
}

export interface MongoObject {
  _id?: ObjectID
}

export interface GitHubRepository {
  nameWithOwner: string
  primaryLanguage: GitHubLanguage
  languages: {
    nodes: GitHubLanguage[]
  }
}

export interface Repository extends MongoObject {
  nameWithOwner: string
  primaryLanguage: string
  languages: string[]
}

export interface GitHubUser extends MongoObject {
  login: string
  company: string
  email: string
  id: string
  isHireable: boolean
  name: string
  websiteUrl: string

  organization: ObjectID

  repositories: ObjectID[]
}

export interface Organization {
  members: EdgePageResponse<GitHubUser>
}