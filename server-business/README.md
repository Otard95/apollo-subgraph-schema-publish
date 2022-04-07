# GQL Contracts

> \<Insert about paragraph here>

## Requirements

- Docker
- NodeJS
- yarn~

`~` not strictly required but will require reconfiguration

## Setup

```bash
$ yarn setup # to initilize redis container and link `src` folder.
$ yarn       # to install all dependencies
```

## Usage

Start the GraphQL server with `yarn dev`.  
When making changes to the schema, save the files and use `yarn types` to generate new TypeScript type declarations from the schema, which you can then use to type the resolvers you'll use your new schema types in.

## NB! pre/postinstall

The `preinstall` and `postinstall` scripts manage a symbolic link in the `node_modules/`
folder which allows for the import syntax `... from '@/path/to/module` where the root is `src`.
However this requires some manual managing when using `yarn remove` or other commands than `add`.
As thouse will not trigger the scripts(`pre/postinstall`)
and because of yarn's (un)install methud it will delete the entire `src` folder!
So make sure you maually utilize the `pre/postinstall` scripts when using `yarn remove`.

## Useful resources

- https://wehavefaces.net/graphql-shorthand-notation-cheatsheet-17cd715861b6
- https://blog.apollographql.com/three-ways-to-represent-your-graphql-schema-a41f4175100d

## Other information

_Note: This information may be outdated, as it was written on June 2018._

## Troubleshooting apollo-server

To log the HTTP requests sent from the GraphQL server to the backend, you can add `LOG` statements to the arguments passed to `new Request` in `node_modules/apollo-datasource-rest/src/RESTDataSource.ts`. Make sure to run `tsc` to compile the TypeScript sourcefiles afterwards.

## File upload

When using apollo-upload-client, the file is sent as FormData to apollo-server which then receives the file and treats it as a stream. Instead of converting this stream to FormData again (which probably requires saving it to the filesystem or memory) and POSTing it to the backend server, (instilling extra bandwidth usage) it probably makes more sense to just send it directly from the client to the server without passing it through the GraphQL server.

If you still wish to implement file uploading through the GraphQL server, do the following:

1. Use the predefined Upload scala in Mutation
   `upload(file: Upload!): File`
2. Handle the stream in the Mutation resolver

```
upload: async (_source, { file }, _context) => {
  const { stream, filename, mimetype, encoding } = await file;
  // handle `stream` which is a ReadableStream
  // probably saving it to memory and then calling it with a RESTDataSource POST request
  return { filename, mimetype, encoding };
}
```

## Deploy to AWS Dev Server

1. If you don't have the certificate, ask Marius :)
   - Place certificate in the project root
2. Go to the project root in the termianl and enter `sudo ssh -i "graphql.pem" ubuntu@13.53.129.51` and enter your password when asked
3. Once on the server type `cd mittanbud-graphql`
4. Pull repo with `git pull`, if asked for ssh password enter `vglista2007`
5. Run `yarn` just in case
6. Run `pm2 restart 0`
7. Wait a few seconds for Node server to restart, then run `yarn types`
8. Done :)
