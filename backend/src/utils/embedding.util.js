'use strict';

const { env } = require('../config/env');

let openaiClient = null;

function getOpenAIClient() {
  if (!env.openai.apiKey) return null;
  if (!openaiClient) {
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey: env.openai.apiKey });
  }
  return openaiClient;
}

/**
 * Generates a 1536-dim embedding for the given text using OpenAI.
 * Returns null if no API key is configured (graceful degradation).
 */
async function generateEmbedding(text) {
  const client = getOpenAIClient();
  if (!client) return null;

  const truncated = text.slice(0, 8000); // stay within token limits
  const response = await client.embeddings.create({
    model: 'text-embedding-ada-002',
    input: truncated,
  });

  return response.data[0].embedding;
}

/**
 * Builds embedding text from an event or product record.
 */
function buildEmbeddingText(item) {
  const parts = [
    item.title || '',
    item.description || '',
    item.category || '',
    ...(item.tags || []),
    item.location || '',
  ];
  return parts.filter(Boolean).join(' ');
}

/**
 * Whether semantic vector search is available.
 */
function isSemanticSearchEnabled() {
  return Boolean(env.openai.apiKey);
}

module.exports = { generateEmbedding, buildEmbeddingText, isSemanticSearchEnabled };
