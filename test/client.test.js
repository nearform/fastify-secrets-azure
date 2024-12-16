'use strict'

const { test, beforeEach, describe } = require('node:test')

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const secretClientStub = sinon.stub()
const defaultAzureCredentialInstance = sinon.stub()
const clientSecretCredentialInstance = sinon.stub()
const defaultAzureCredentialStub = sinon.stub()
const clientSecretCredentialStub = sinon.stub()

const AzureClient = proxyquire('../lib/client', {
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

beforeEach(async () => {
  sinon.reset()
  defaultAzureCredentialStub.returns(defaultAzureCredentialInstance)
  clientSecretCredentialStub.returns(clientSecretCredentialInstance)
})

describe('options', () => {
  test('throws when vaultName is not provided', async (t) => {
    t.assert.throws(() => new AzureClient(), /`vaultName` is required/)
  })

  test('uses vaultName when provided', async () => {
    // eslint-disable-next-line no-unused-vars
    const _ = new AzureClient({ vaultName: 'vault-name' })

    sinon.assert.calledWith(
      secretClientStub,
      `https://vault-name.vault.azure.net`
    )
  })

  test('uses default credentials when no credentials provided', async (t) => {
    // eslint-disable-next-line no-unused-vars
    const _ = new AzureClient({ vaultName: 'vault-name' })

    const creds = secretClientStub.firstCall.args[1]

    t.assert.strictEqual(creds, defaultAzureCredentialInstance)
  })

  test('uses provided credentials', async (t) => {
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

    const creds = secretClientStub.firstCall.args[1]

    t.assert.strictEqual(creds, clientSecretCredentialInstance)

    sinon.assert.calledWith(
      clientSecretCredentialStub,
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    )
  })
})

describe('get', () => {
  test('secret', async (t) => {
    const getSecret = sinon.stub()

    secretClientStub.returns({
      getSecret
    })

    const client = new AzureClient({ vaultName: 'vault-name' })

    getSecret.resolves({ value: 'secret-value' })

    const secret = await client.get('secret-name')

    sinon.assert.called(getSecret)
    sinon.assert.calledWith(getSecret, 'secret-name')
    t.assert.strictEqual(secret, 'secret-value')
  })

  test('sdk error', async (t) => {
    secretClientStub.returns({
      getSecret: sinon.stub().rejects(new Error())
    })
    const client = new AzureClient({ vaultName: 'vault-name' })

    const promise = client.get('secret/name')

    await t.assert.rejects(promise, 'throws error')
  })
})
