'use strict'

const { test, beforeEach, describe, mock } = require('node:test')

const proxyquire = require('proxyquire')

let secretClientStub
let defaultAzureCredentialInstance
let clientSecretCredentialInstance
let defaultAzureCredentialStub
let clientSecretCredentialStub
let AzureClient

beforeEach(async () => {
  mock.reset()

  secretClientStub = mock.fn()
  defaultAzureCredentialInstance = mock.fn()
  clientSecretCredentialInstance = mock.fn()
  defaultAzureCredentialStub = mock.fn()
  clientSecretCredentialStub = mock.fn()

  defaultAzureCredentialStub.mock.mockImplementation(
    () => defaultAzureCredentialInstance
  )
  clientSecretCredentialStub.mock.mockImplementation(
    () => clientSecretCredentialInstance
  )

  AzureClient = proxyquire('../lib/client', {
    '@azure/identity': {
      DefaultAzureCredential: function () {
        return defaultAzureCredentialStub()
      },
      ClientSecretCredential: function (...args) {
        return clientSecretCredentialStub(...args)
      }
    },
    '@azure/keyvault-secrets': {
      SecretClient: function (...args) {
        return secretClientStub(...args)
      }
    }
  })
})

describe('options', () => {
  test('throws when vaultName is not provided', (t) => {
    t.assert.throws(() => new AzureClient(), /`vaultName` is required/)
  })

  test('uses vaultName when provided', (t) => {
    // eslint-disable-next-line no-unused-vars
    const _ = new AzureClient({ vaultName: 'vault-name' })

    t.assert.strictEqual(secretClientStub.mock.callCount(), 1)
    t.assert.strictEqual(
      secretClientStub.mock.calls[0].arguments[0],
      `https://vault-name.vault.azure.net`
    )
  })

  test('uses default credentials when no credentials provided', (t) => {
    // eslint-disable-next-line no-unused-vars
    const _ = new AzureClient({ vaultName: 'vault-name' })

    const creds = secretClientStub.mock.calls[0].arguments[1]

    t.assert.strictEqual(creds, defaultAzureCredentialInstance)
  })

  test('uses provided credentials', (t) => {
    const credentials = {
      tenantId: 'tenantId',
      clientId: 'clientId',
      clientSecret: 'clientSecret'
    }

    // eslint-disable-next-line no-unused-vars
    const _ = new AzureClient({
      vaultName: 'vault-name',
      credentials
    })

    const creds = secretClientStub.mock.calls[0].arguments[1]

    t.assert.deepEqual(creds, clientSecretCredentialInstance)
    t.assert.deepStrictEqual(
      clientSecretCredentialStub.mock.calls[0].arguments,
      [credentials.tenantId, credentials.clientId, credentials.clientSecret]
    )
  })
})

describe('get', () => {
  test('secret', async (t) => {
    const getSecret = t.mock.fn()

    secretClientStub.mock.mockImplementation(() => ({
      getSecret
    }))

    const client = new AzureClient({ vaultName: 'vault-name' })

    getSecret.mock.mockImplementation(() =>
      Promise.resolve({ value: 'secret-value' })
    )

    const secret = await client.get('secret-name')

    t.assert.strictEqual(getSecret.mock.callCount(), 1)
    t.assert.strictEqual(getSecret.mock.calls[0].arguments[0], 'secret-name')
    t.assert.strictEqual(secret, 'secret-value')
  })

  test('sdk error', async (t) => {
    secretClientStub.mock.mockImplementation(() => ({
      getSecret: t.mock.fn(() => Promise.reject(new Error()))
    }))
    const client = new AzureClient({ vaultName: 'vault-name' })

    const promise = client.get('secret/name')

    await t.assert.rejects(promise, 'throws error')
  })
})
