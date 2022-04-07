import './setup-env'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSubgraphSchema } from '@apollo/subgraph'
import http from 'http'
import merge from 'lodash.merge'

import { typeDefs, resolvers } from '@/schema'

const port = process.env.PORT || 4300
const app = express()
const server = http.createServer(app)

// This must be the first piece of middleware in the stack.
// It can only capture errors in downstream middleware

const apolloServer = new ApolloServer({
  schema: buildSubgraphSchema({
    typeDefs,
    resolvers: merge({}, ...resolvers),
  }),
  // Remove or set introspection and playground to false to disable Playground in prod mode
  introspection: true,
})

async function init() {
  try {
    await apolloServer.start()

    apolloServer.applyMiddleware({ app })

    server.listen({ port }, () => {
      console.log(
        `🚀 Server ready at http://localhost:${port}${apolloServer.graphqlPath}`
      )
    })

    app.use(((err, _req, _res, next) => {
      if (err) console.error(err)
      next(err)
    }) as express.ErrorRequestHandler)
  } catch (err) {
    console.error(err, 'Failed to start apollo server')
    process.exit(1)
  }
}

init()
