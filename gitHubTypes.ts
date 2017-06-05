import { ObjectID } from "mongodb";


export interface Edge<T> {
  node: T
}

export interface GitHubNode {
  id: string
}

export interface EdgeResponse<T> {
  edges: Edge<T>[]
}

export interface NodesResponse<T> {
  nodes: T[]
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


export interface MongoObject {
  _id?: ObjectID
}

export interface GitHubRepository extends GitHubNode {
  nameWithOwner?: string
  primaryLanguage?: GitHubLanguage
  languages?: {
    nodes: GitHubLanguage[]
  }
}

export interface GitHubUser extends GitHubNode {
  login: string
  company: string
  email: string
  isHireable: boolean
  name: string
  websiteUrl: string

  repositories: NodesResponse<GitHubRepository>
}

export interface Repository extends MongoObject {
  id: string
  nameWithOwner?: string
  primaryLanguage?: string
  languages?: string[]
}

export interface User extends MongoObject {
  login: string
  company: string
  email: string
  id: string
  isHireable: boolean
  name: string
  websiteUrl: string

  organization: ObjectID

  repositories?: ObjectID[]
}

export interface Organization {
  members: EdgePageResponse<GitHubUser>
}