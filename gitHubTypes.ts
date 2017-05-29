import { ObjectID } from "mongodb";

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