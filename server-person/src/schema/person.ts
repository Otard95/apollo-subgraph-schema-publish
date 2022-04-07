import { gql } from 'apollo-server'
import { Resolvers } from '@/generated/graphql'

const people = [
  {
    id: '1',
    name: 'John Doe',
  },
  {
    id: '2',
    name: 'Jane Doe',
  },
  {
    id: '3',
    name: 'John Wick',
  },
  {
    id: '4',
    name: 'James Bond',
  },
]

export const typeDef = gql`
  type Person @key(fields: "id") {
    id: ID!
    name: String!
  }

  extend type Query {
    person(id: ID!): Person
  }
`

export const resolver: Resolvers = {
  Query: {
    person: (_, { id }) => people.find(p => p.id === id) || null,
  },
  Person: {
    __resolveReference: person => people.find(p => p.id === person.id) || null,
  },
}
