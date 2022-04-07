# mittanbud-gateway

A [Apollo Gateway](https://www.apollographql.com/docs/federation/gateway/) used
as the entrypoint to all underlying federated services.

> *Read more about Apollo federation here:
> [https://www.apollographql.com/docs/federation/](https://www.apollographql.com/docs/federation/)*

## Local development

### Generate config file

In order to get the proper configuration for the gateway, you need to install
the [gql config cli](https://github.com/schibsted-smb/graphql-config-generator).
This will let you generate the config with its endpoints for the gateway.

After installing the gql helper tool, use the following command to generate the
config file: `gql-gc gateway mittanbud-local -o src/config.json`

> *NOTE: you can specify another gateway instead of `mittanbud-local` to get
> configuration for other environments.
To get the list of gateways, you can download the secret containing these using the
[same tool](https://github.com/schibsted-smb/graphql-config-generator): `gql-gc dl`.
WARNING: Do not commit the file `aio-config.json` downloaded with this script*

### Setup dependencies

- Setup husky and create the redis container: `npm run setup`
- Ensure that you have `GITHUB_TOKEN` set in your environment as npm will use
  that to install private dependencies
- You can generate this token [here](https://github.com/settings/tokens).
  Name it what ever you want to help you keep track, and you'll need to check
  for `read:packages`.

### Running the gateway locally

- Run the gateway: `npm run dev`. This will display a few prompts which will
  allow you to alter the endpoints used when targeting other graphql services.

If you don't want to target the local redis instance, change the redis value in
`src/config,json` or pull down the appropriate config for the environment you are targeting.

A file `src/dev-endpoints.json` containing the endpoints to other graphql services
is generated based on the input and the gateway will start in interactive mode
including a redis docker container.

> *NOTE: the file `src/dev-endpoints.json` should never be altered directly.
> Use the interactive shell when adjusting the configuration*

### Environment variables

To change or add your own environment variables for local development, create a
`.env` file in root of the project and insert the values you need like so:

```env
VAR_NAME=VAR_VALUE
```

### Commit guidelines

[Follow this guideline for commit convention](https://github.com/schibsted-smb/documentation#commit-guidelines)
