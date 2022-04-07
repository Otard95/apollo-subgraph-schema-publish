import { gql } from 'apollo-server'
import { Resolvers } from '@/generated/graphql'

export const typeDef = gql`
  type Foo {
    id: ID!
    name: String!
  }
`

export const resolver: Resolvers = {
  Foo: {
    id: () => '83c571a4-4923-4e18-881d-4c735616dce2',
    name: () => 'Foo',
  },
}
