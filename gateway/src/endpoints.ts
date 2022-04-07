import { ServiceEndpointDefinition } from '@apollo/gateway'

export default [
  {
    name: 'person',
    url: 'http://localhost:4200/graphql',
  },
  {
    name: 'business',
    url: 'http://localhost:4300/graphql',
  },
] as ServiceEndpointDefinition[]
