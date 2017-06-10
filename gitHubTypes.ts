import { ObjectID, Db } from "mongodb";

export type NodeType = "User" | "Repository" | "Organization" | "Language";

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

export interface GitHubLanguage extends GitHubNode {
  id: string
  name: string
}


export interface MongoNode {
  _id?: ObjectID
  id?: string
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
  organizations: NodesResponse<GitHubOrganization>
}

export interface Repository extends MongoNode {
  nameWithOwner?: string
  primaryLanguage?: string
  languages?: string[]
}

export interface User extends MongoNode {
  login?: string
  company?: string
  email?: string
  isHireable?: boolean
  name?: string
  websiteUrl?: string

  // references to other collections
  organizations?: ObjectID[]
  repositories?: ObjectID[]
}

export interface Organization extends MongoNode {
  members?: ObjectID[]
  login?: string
  name?: string
}

export interface Language extends MongoNode {
  name?: string
}

export interface GitHubOrganization extends GitHubNode {
  members: EdgePageResponse<GitHubUser>
  login?: string
  name?: string
}

export interface GitHubResourceScraperFn {
  (db:Db): Promise<any>
}