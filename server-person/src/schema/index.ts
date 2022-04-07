import { gql } from 'apollo-server'
import * as contract from '@/schema/person'
import { Resolvers } from '@/generated/graphql'

// We want to be able to use `extend type` on Query and Mutation in our schemas.
// To be able to do this consistently, we need to initially define them first.
const baseTypeDef = gql`
  type Query
`

export const typeDefs = [baseTypeDef, contract.typeDef]

export const resolvers: Resolvers[] = [contract.resolver]
