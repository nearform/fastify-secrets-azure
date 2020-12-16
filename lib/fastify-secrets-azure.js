'use strict'

const { buildPlugin } = require('fastify-secrets-core')

const AzureClient = require('./client')

module.exports = buildPlugin(AzureClient, {
  name: 'fastify-secrets-azure'
})
