import { gql } from 'apollo-server'
import { Business, Resolvers } from '@/generated/graphql'
import { Resolvable } from '@/types/resolvable'

const businesses = [
  {
    id: '1',
    name: 'Whistler',
    employees: [
      {
        __typename: 'Person',
        id: '1',
      },
      {
        __typename: 'Person',
        id: '2',
      },
    ],
  },
  {
    id: '2',
    name: 'Bookface',
    employees: [
      {
        __typename: 'Person',
        id: '3',
      },
      {
        __typename: 'Person',
        id: '4',
      },
    ],
  },
]

export const typeDef = gql`
  extend type Person @key(fields: "id") {
    id: ID! @external
  }

  type Business @key(fields: "id") {
    id: ID!
    name: String!
    employees: [Person!]!
  }

  extend type Query {
    business(id: ID!): Business
  }
`

export const resolver: Resolvers = {
  Query: {
    business: (_, { id }) =>
      (businesses.find(b => b.id === id) as Resolvable<Business>) || null,
  },
  Business: {
    __resolveReference: business =>
      (businesses.find(b => b.id === business.id) as Resolvable<Business>) ||
      null,
  },
}
