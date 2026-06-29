import { describe, it, expect } from '@jest/globals';
import endpoints from './endpoints.js';

describe('endpoints config', () => {
  // v4.0 regression guard: the app exposes exactly these three tabs.
  it('should expose exactly the messages, skills, and files endpoints', () => {
    expect(Object.keys(endpoints)).toEqual(['messages', 'skills', 'files']);
  });

  it('should give every endpoint an id, name, description, method, and path', () => {
    Object.entries(endpoints).forEach(([key, ep]) => {
      expect(ep.id).toBe(key);
      expect(typeof ep.name).toBe('string');
      expect(typeof ep.description).toBe('string');
      expect(['GET', 'POST', 'DELETE']).toContain(ep.method);
      expect(ep.path.startsWith('/v1/')).toBe(true);
    });
  });
});

describe('messages endpoint', () => {
  const messages = endpoints.messages;

  it('should be a streaming-capable POST to /v1/messages', () => {
    expect(messages.method).toBe('POST');
    expect(messages.path).toBe('/v1/messages');
    expect(messages.supportsStreaming).toBe(true);
    expect(messages.requiresModel).toBe(true);
  });

  it('should require model, messages, and max_tokens', () => {
    expect(messages.parameters.required).toEqual(['model', 'messages', 'max_tokens']);
  });

  it('should include the current optional request params', () => {
    const optional = messages.parameters.optional;
    ['system', 'tools', 'thinking', 'output_config', 'speed', 'container', 'diagnostics'].forEach(p => {
      expect(optional).toContain(p);
    });
  });
});

describe('skills endpoint', () => {
  it('should define create, get, and delete sub-endpoints', () => {
    expect(Object.keys(endpoints.skills.subEndpoints)).toEqual(['create', 'get', 'delete']);
  });
});

describe('files endpoint', () => {
  const files = endpoints.files;

  it('should define upload, get, delete, and download sub-endpoints', () => {
    expect(Object.keys(files.subEndpoints)).toEqual(['upload', 'get', 'delete', 'download']);
  });

  it('should use the correct paths for file sub-endpoints', () => {
    expect(files.subEndpoints.upload.method).toBe('POST');
    expect(files.subEndpoints.upload.path).toBe('/v1/files');
    expect(files.subEndpoints.get.path).toBe('/v1/files/:id');
    expect(files.subEndpoints.delete.method).toBe('DELETE');
    expect(files.subEndpoints.download.path).toBe('/v1/files/:id/content');
  });

  it('should support pagination params on list', () => {
    expect(files.parameters.optional).toEqual(['limit', 'before_id', 'after_id']);
  });
});
