'use strict'

const { DefaultAzureCredential, ClientSecretCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')

function assertOptions(options) {
  if (!options || !options.vaultName) {
    throw new Error('fastify-secrets-azure: `vaultName` is required')
  }
}

class AzureClient {
  constructor(options) {
    assertOptions(options)

    const vaultName = options.vaultName
    const credentials = options.credentials

    const credential = credentials
      ? new ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret)
      : new DefaultAzureCredential()

    this.secretClient = new SecretClient(`https://${vaultName}.vault.azure.net`, credential)
  }

  async get(name) {
    try {
      const secret = await this.secretClient.getSecret(name)

      return secret.value
    } catch (err) {
      throw new Error(`Secret not found: ${name}`)
    }
  }
}

module.exports = AzureClient
