import { describe, it, expect } from '@jest/globals';
import {
  getEndpoint,
  getAllEndpoints,
  getEndpointIds,
  endpointSupports
} from './endpoints.js';

describe('getEndpoint', () => {
  it('should return correct endpoint for valid ID', () => {
    const endpoint = getEndpoint('messages');

    expect(endpoint).toBeDefined();
    expect(endpoint.id).toBe('messages');
    expect(endpoint.method).toBe('POST');
    expect(endpoint.path).toBe('/v1/messages');
  });

  it('should return undefined for unknown endpoint ID', () => {
    const endpoint = getEndpoint('unknown');
    expect(endpoint).toBeUndefined();
  });

  it('should return batches endpoint with subEndpoints', () => {
    const endpoint = getEndpoint('batches');

    expect(endpoint).toBeDefined();
    expect(endpoint.id).toBe('batches');
    expect(endpoint.subEndpoints).toBeDefined();
    expect(endpoint.subEndpoints.get).toBeDefined();
    expect(endpoint.subEndpoints.list).toBeDefined();
  });

  it('should expose speed and container as optional Messages params', () => {
    const endpoint = getEndpoint('messages');
    expect(endpoint.parameters.optional).toContain('speed');
    expect(endpoint.parameters.optional).toContain('container');
  });

  it('should return files endpoint with subEndpoints', () => {
    const endpoint = getEndpoint('files');

    expect(endpoint).toBeDefined();
    expect(endpoint.id).toBe('files');
    expect(endpoint.path).toBe('/v1/files');
    expect(endpoint.subEndpoints).toBeDefined();
    expect(endpoint.subEndpoints.upload).toBeDefined();
    expect(endpoint.subEndpoints.upload.method).toBe('POST');
    expect(endpoint.subEndpoints.get).toBeDefined();
    expect(endpoint.subEndpoints.delete).toBeDefined();
    expect(endpoint.subEndpoints.delete.method).toBe('DELETE');
    expect(endpoint.subEndpoints.download).toBeDefined();
    expect(endpoint.subEndpoints.download.path).toBe('/v1/files/:id/content');
  });
});

describe('getAllEndpoints', () => {
  it('should return all endpoints', () => {
    const endpoints = getAllEndpoints();

    expect(endpoints).toBeDefined();
    expect(typeof endpoints).toBe('object');
    expect(endpoints.messages).toBeDefined();
    expect(endpoints.batches).toBeDefined();
    expect(endpoints.models).toBeDefined();
  });
});

describe('getEndpointIds', () => {
  it('should return array of endpoint IDs', () => {
    const ids = getEndpointIds();

    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
  });

  it('should include standard endpoints', () => {
    const ids = getEndpointIds();

    expect(ids).toContain('messages');
    expect(ids).toContain('batches');
    expect(ids).toContain('models');
    expect(ids).toContain('usage');
    expect(ids).toContain('cost');
    expect(ids).toContain('skills');
    expect(ids).toContain('files');
  });
});

describe('endpointSupports', () => {
  it('should return true for messages endpoint streaming support', () => {
    const result = endpointSupports('messages', 'streaming');
    expect(result).toBe(true);
  });

  it('should return false for batches endpoint streaming support', () => {
    const result = endpointSupports('batches', 'streaming');
    expect(result).toBe(false);
  });

  it('should return true for batches endpoint async support', () => {
    const result = endpointSupports('batches', 'async');
    expect(result).toBe(true);
  });

  it('should return false for messages endpoint async support', () => {
    const result = endpointSupports('messages', 'async');
    expect(result).toBe(false);
  });

  it('should return true for messages endpoint model support', () => {
    const result = endpointSupports('messages', 'model');
    expect(result).toBe(true);
  });

  it('should return false for unknown endpoint', () => {
    const result = endpointSupports('unknown', 'streaming');
    expect(result).toBe(false);
  });

  it('should return false for unknown feature', () => {
    const result = endpointSupports('messages', 'unknown_feature');
    expect(result).toBe(false);
  });
});
