import { describe, it, expect } from 'vitest';
import { serializeSession, deserializeSession } from './save-load';
import type { WorkbenchState } from './types';

function createMinimalState(): WorkbenchState {
  return {
    current: 'inbox',
    status: {
      inbox: 'ready',
      'business-need': 'locked',
      'requirement-analysis': 'locked',
      discovery: 'locked',
      epic: 'locked',
      'user-story': 'locked',
      'acceptance-criteria': 'locked',
      readiness: 'locked',
      signoff: 'locked',
      export: 'locked',
    },
    answers: {},
    data: {
      inbox: { inputs: {}, sources: [], cards: [] },
      signoff: {},
    },
    sourceId: 'free',
    elapsed: 0,
    frozen: false,
    live: true,
    preserve: true,
    copilotMessages: [],
  };
}

describe('save-load: serialization', () => {
  it('serializes a valid state to JSON', () => {
    const state = createMinimalState();
    const json = serializeSession(state);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe('1');
    expect(parsed.format).toBe('po-workbench-session');
    expect(parsed.savedAt).toBeDefined();
    expect(parsed.state).toEqual(state);
  });

  it('includes savedAt timestamp in ISO format', () => {
    const state = createMinimalState();
    const json = serializeSession(state);
    const parsed = JSON.parse(json);
    const timestamp = new Date(parsed.savedAt);

    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(parsed.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('save-load: deserialization', () => {
  it('deserializes a valid session file', () => {
    const original = createMinimalState();
    const json = serializeSession(original);
    const restored = deserializeSession(json);

    expect(restored).toEqual(original);
  });

  it('rejects invalid JSON', () => {
    expect(() => deserializeSession('not json')).toThrow('Invalid JSON');
  });

  it('rejects wrong format', () => {
    const badFormat = JSON.stringify({
      version: '1',
      format: 'wrong-format',
      state: createMinimalState(),
    });
    expect(() => deserializeSession(badFormat)).toThrow('Not a PO Workbench session file');
  });

  it('rejects unsupported version', () => {
    const badVersion = JSON.stringify({
      version: '2',
      format: 'po-workbench-session',
      state: createMinimalState(),
    });
    expect(() => deserializeSession(badVersion)).toThrow('Unsupported session version');
  });

  it('rejects missing status', () => {
    const noStatus = JSON.stringify({
      version: '1',
      format: 'po-workbench-session',
      state: { current: 'inbox' },
    });
    expect(() => deserializeSession(noStatus)).toThrow('corrupted');
  });

  it('defaults missing live flag to true', () => {
    const state = createMinimalState();
    // @ts-ignore - intentionally removing live to test default
    delete state.live;
    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.live).toBe(true);
  });

  it('defaults missing preserve flag to true', () => {
    const state = createMinimalState();
    // @ts-ignore
    delete state.preserve;
    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.preserve).toBe(true);
  });

  it('defaults missing copilotMessages to empty array', () => {
    const state = createMinimalState();
    // @ts-ignore
    delete state.copilotMessages;
    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.copilotMessages).toEqual([]);
  });
});

describe('save-load: migrations', () => {
  it('migrates pre-signoff state: export not locked', () => {
    const oldState = createMinimalState();
    // @ts-ignore
    delete oldState.status.signoff;
    oldState.status.export = 'ready';

    const json = serializeSession(oldState);
    const restored = deserializeSession(json);

    expect(restored.status.signoff).toBe('review');
    expect(restored.status.export).toBe('locked');
    expect(restored.frozen).toBe(false);
  });

  it('migrates pre-signoff state: export already locked', () => {
    const oldState = createMinimalState();
    // @ts-ignore
    delete oldState.status.signoff;
    oldState.status.export = 'locked';

    const json = serializeSession(oldState);
    const restored = deserializeSession(json);

    expect(restored.status.signoff).toBe('locked');
  });

  it('does not override signoff status if already present', () => {
    const state = createMinimalState();
    state.status.signoff = 'done';

    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.status.signoff).toBe('done');
  });

  it('migrates old freeText → inputs.free', () => {
    const state = {
      ...createMinimalState(),
      data: {
        // @ts-ignore - old shape
        inbox: { freeText: 'old free text here' },
      },
    };

    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.data.inbox).toEqual({
      inputs: { free: 'old free text here' },
      sources: [],
      cards: [],
    });
  });

  it('initializes missing inbox data to defaults', () => {
    const state = createMinimalState();
    delete state.data.inbox;

    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.data.inbox).toEqual({
      inputs: {},
      sources: [],
      cards: [],
    });
  });

  it('initializes missing signoff data', () => {
    const state = createMinimalState();
    // @ts-ignore - intentionally removing signoff to test default
    delete state.data.signoff;

    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.data.signoff).toEqual({});
  });

  it('preserves inbox data shape if already correct', () => {
    const state = createMinimalState();
    state.data.inbox = {
      inputs: { free: 'some text' },
      sources: [{ id: 'src1', name: 'file.txt', time: 'Now', status: 'ok' }],
      cards: [{ id: 'c1', label: 'Need', catKey: 'need', custom: false, naming: false, insights: [], fresh: false }],
    };

    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.data.inbox).toEqual(state.data.inbox);
  });

  it('round-trips a complex multi-stage state', () => {
    const state = createMinimalState();
    state.current = 'epic';
    state.status.inbox = 'done';
    state.status['business-need'] = 'done';
    state.status['requirement-analysis'] = 'review';
    state.data['business-need'] = {
      businessProblem: 'Users struggle with onboarding',
      outcomes: ['Reduce signup time by 50%', 'Increase retention'],
      confidence: 85,
      improvementTips: ['Add tooltips'],
    };
    state.answers['q1'] = 'answer text';
    state.elapsed = 3661;
    state.frozen = true;

    const json = serializeSession(state);
    const restored = deserializeSession(json);

    expect(restored.current).toBe('epic');
    expect(restored.status['business-need']).toBe('done');
    expect(restored.data['business-need']).toEqual(state.data['business-need']);
    expect(restored.answers['q1']).toBe('answer text');
    expect(restored.elapsed).toBe(3661);
    expect(restored.frozen).toBe(true);
  });
});
