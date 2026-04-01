'use strict';

const { env } = require('../config/env');

let genaiClient = null;

function getClient() {
  if (!env.googleAI.apiKey) return null;
  if (!genaiClient) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genaiClient = new GoogleGenerativeAI(env.googleAI.apiKey);
  }
  return genaiClient;
}

/**
 * Generates a 3072-dim embedding for a document (event/product) using gemini-embedding-001.
 * Returns null if no API key is configured (graceful degradation to full-text search).
 */
async function generateEmbedding(text) {
  const client = getClient();
  if (!client) return null;

  const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });
  const truncated = text.slice(0, 8000);
  const result = await model.embedContent({
    content: { parts: [{ text: truncated }] },
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: 768,
  });

  return result.embedding.values;
}

/**
 * Generates a 3072-dim embedding for a search query using gemini-embedding-001.
 * Uses RETRIEVAL_QUERY task type for better semantic matching.
 */
async function generateQueryEmbedding(text) {
  const client = getClient();
  if (!client) return null;

  const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });
  const truncated = text.slice(0, 2000);
  const result = await model.embedContent({
    content: { parts: [{ text: truncated }] },
    taskType: 'RETRIEVAL_QUERY',
    outputDimensionality: 768,
  });

  return result.embedding.values;
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
  return Boolean(env.googleAI.apiKey);
}

module.exports = { generateEmbedding, generateQueryEmbedding, buildEmbeddingText, isSemanticSearchEnabled };
