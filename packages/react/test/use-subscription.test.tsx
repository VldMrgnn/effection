import { describe, it } from '@effection/mocha';
import expect from 'expect';
import { createQueue, sleep, Subscription } from 'effection';
import { useSubscription } from '../src/index';
import React from 'react';
import { ReactTestRenderer } from 'react-test-renderer';
import { render } from './helpers';

type TestComponentProps = {
  subscription: Subscription<string>;
}

describe('useSubscription', () => {
  it('updates the component when a new value is pushed to the subscription', function*() {
    function TestComponent(props: TestComponentProps): JSX.Element {
      let value = useSubscription(props.subscription);
      return (
        <h1>{value}</h1>
      );
    }

    let queue = createQueue<string>();
    let renderer: ReactTestRenderer = yield render(
      <TestComponent subscription={queue.subscription}/>
    );

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: null });

    queue.send("hello");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello'] });

    queue.send("world");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['world'] });
  });

  it('can set initial value', function*() {
    function TestComponent(props: TestComponentProps): JSX.Element {
      let value = useSubscription(props.subscription, 'monkey');
      return (
        <h1>{value}</h1>
      );
    }

    let queue = createQueue<string>();
    let renderer: ReactTestRenderer = yield render(
      <TestComponent subscription={queue.subscription}/>
    );

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['monkey'] });

    queue.send("hello");
    yield sleep(5);

    expect(renderer.toJSON()).toMatchObject({ type: 'h1', children: ['hello'] });
  });
});
