import { describe, it, beforeEach, afterEach, captureError } from '@effection/mocha';
import expect from 'expect';

import { run, Task, createFuture, fetch } from 'effection';

import { daemon, Process } from '../src';
import { Daemon } from '../src/daemon';

describe('daemon', () => {
  let task: Task;
  let proc: Process;

  beforeEach(function*() {
    let { future, produce } = createFuture();
    task = run(function*() {
      let proc: Daemon = yield daemon('node', {
        arguments: ['./fixtures/echo-server.js'],
        env: { PORT: '29000', PATH: process.env.PATH as string },
        cwd: __dirname,
      });
      produce({ state: 'completed', value: proc });
      yield;
    });
    proc = yield future;

    yield proc.stdout.filter((v) => v.includes('listening')).expect();
  });

  afterEach(function*() {
    yield task.halt();
  });

  it('starts the given child', function*() {
    let result = yield fetch('http://localhost:29000', { method: "POST", body: "hello" });
    let text = yield result.text();

    expect(result.status).toEqual(200);
    expect(text).toEqual("hello");
  });

  describe('halting the daemon task', () => {
    beforeEach(function*() {
      task.halt();
    });
    it('kills the process', function*() {
      expect(yield captureError(fetch(`http://localhost:29000`, { method: "POST", body: "hello" }))).toHaveProperty('name', 'FetchError');
    });
  });

  describe('shutting down the daemon process prematurely', () => {
    beforeEach(function*() {
      yield fetch('http://localhost:29000', { method: "POST", body: "exit" });
    });

    it('throw an error because it was not expected to close', function*() {
      yield expect(task).rejects.toHaveProperty('name', 'DaemonExitError');
    });
  });
});
