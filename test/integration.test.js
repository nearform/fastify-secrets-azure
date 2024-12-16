'use strict'

require('dotenv').config()

const { test } = require('node:test')
const uuid = require('uuid')
const Fastify = require('fastify')
const { DefaultAzureCredential } = require('@azure/identity')
const { SecretClient } = require('@azure/keyvault-secrets')

const FastifySecrets = require('../')

const SECRET_NAME = uuid.v4()
const SECRET_CONTENT = uuid.v4()
const vaultName = process.env.AZURE_VAULT_NAME

const credential = new DefaultAzureCredential()
const client = new SecretClient(
  `https://${vaultName}.vault.azure.net`,
  credential
)

function createSecret() {
  return client.setSecret(SECRET_NAME, SECRET_CONTENT)
}

test('integration', async (t) => {
  t.test('decorates fastify with secret content', async (t) => {
    await createSecret()

    const fastify = Fastify({
      logger: process.env.TEST_LOGGER || false
    })

    fastify.register(FastifySecrets, {
      secrets: {
        test: SECRET_NAME
      },
      clientOptions: {
        vaultName
      }
    })

    await fastify.ready()

    t.assert.deepStrictEqual(fastify.secrets.test, SECRET_CONTENT)
  })
})
