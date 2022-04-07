import { ApolloServer } from 'apollo-server-express'
import { ApolloGateway, GatewayConfig } from '@apollo/gateway'

import ENDPOINTS from '@/endpoints'

const gatewayProps: GatewayConfig = {
  serviceList: ENDPOINTS,
}

const gateway = new ApolloGateway(gatewayProps)
const apolloServer = new ApolloServer({
  gateway,
  apollo: {
    graphRef: process.env.APOLLO_GRAPH_REF,
  },
  // Remove or set introspection and playground to false to disable Playground in prod mode
  introspection: true,
})

export default apolloServer
