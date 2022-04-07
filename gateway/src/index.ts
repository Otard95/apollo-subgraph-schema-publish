import './setup-env'
import express from 'express'

import apollo from '@/apollo'

const port = process.env.PORT || 5000
const app = express()

async function init() {
  try {
    await apollo.start()
  } catch (err) {
    console.error(err, 'Failed to start apollo server')
    process.exit(1)
  }

  app.listen({ port }, () => {
    console.log(
      `🚀 Server ready at http://localhost:${port}${apollo.graphqlPath}`
    )
  })

  app.use(((err, _req, _res, next) => {
    if (err) console.error(err)
    next(err)
  }) as express.ErrorRequestHandler)
}

init()
