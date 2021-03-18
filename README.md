# Fastify Secrets Azure

![CI](https://github.com/nearform/fastify-secrets-azure/workflows/CI/badge.svg)

Fastify secrets plugin for [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/).

## Installation

```
npm install --save fastify-secrets-azure
```

## Usage

### Set up Azure Key Vault

In order to be able to read from Azure Key Vault you will need some permissions.

You will also probably manage permissions in different ways in local dev and production environment.
In general you may want to use a different secrets manager on your local machine (i.e. `fastify-secrets-env` to read secrets from env variables).

To set up a Key Vault to be accessed by `fastify-secrets-azure` please read the instructions in the [official documentation](https://docs.microsoft.com/en-us/javascript/api/overview/azure/keyvault-secrets-readme?view=azure-node-latest#configuring-your-key-vault).

This will set up the vault and create an application capable of accessing it.

The information required to connect to Azure Key Vault can be stored in the environment or provided via plugin options, as described below.

Check out the [official documentation](https://docs.microsoft.com/en-us/javascript/api/overview/azure/keyvault-secrets-readme?view=azure-node-latest#configuring-your-key-vault) for information about which environment variables are needed.

### Add plugin to your fastify instance

```js
const FastifySecrets = require('fastify-secrets-azure')

fastify.register(FastifySecrets, {
  secrets: {
    dbPassword: 'secret-name'
  },
  clientOptions: {
    vaultName: 'vault-name'
  }
})
```

`secret-name` is the name of the secret as created in Azure Key Vault.

### Access you secrets

```js
await fastify.ready()

console.log(fastify.secrets.dbPassword) // content of 'secret-name'
```

### Plugin options

- `secrets` `[object]` (required) A map of keys and resource ids for the secrets. `fastify-secrets-azure` will decorate the fastify server with a `secrets` object where keys will be the same keys of the options and the value will be the content of the secret as fetched from Azure Key Vault
- `clientOptions` `[object]` (required) An object containing properties to be provided to the client used to connect to Azure Key Vault. Supports the following keys:
  - `vaultName` `[string]` (required) The name of the vault
  - `credentials` `[object]` (optional). Credentials for connection. If not provided, the client will use the default ones configured in environment variables:
    - `tenantId` Defaults to `AZURE_TENANT_ID` environment variable
    - `clientId` Defaults to `AZURE_CLIENT_ID` environment variable
    - `clientSecret` Defaults to `AZURE_CLIENT_SECRET` environment variable

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

Copyright NearForm Ltd 2021. Licensed under the [Apache-2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
