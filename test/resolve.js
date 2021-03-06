import test from 'ava';
import { Context } from '../src';

test('Resolve', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.is(await context.resolve(key), value);
});

test('Memoized resolve', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  let count = 0;

  // When
  context.provide(key).with(() => {
    count++;
  });

  await context.resolve(key);
  await context.resolve(key);

  // Then
  t.is(count, 1);
});

test('Resolve Promise', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(Promise.resolve(value));

  // Then
  t.is(await context.resolve(key), value);
});

test('Resolve getter', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).with(() => value);

  // Then
  t.is(await context.resolve(key), value);
});

test('Resolve alias', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const aliasKey = 'test-key-alias';
  const value = 'test-value';

  context.provide(key).as(value);

  // When
  context.provide(aliasKey).aliasTo(key);

  // Then
  t.is(await context.resolve(aliasKey), value);
});

test('Resolve all (cond=undefined)', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.deepEqual(await context.resolveAll(), [value]);
});

test('Resolve all (cond=true)', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.deepEqual(await context.resolveAll(true), [value]);
});

test('Resolve all (null)', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.deepEqual(await context.resolveAll(null), []);
});

test('Resolve none (cond=false)', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.deepEqual(await context.resolveAll(false), []);
});

test('Resolve by regular expression', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.deepEqual(await context.resolveAll(/^test-/), [value]);
  t.deepEqual(await context.resolveAll(/^test-$/), []);
});

test('Resolve by array', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.deepEqual(await context.resolveAll([key]), [value]);
});

test('Resolve by predicator function', async t => {
  // Given
  const context = new Context();
  const key = 'test-key';
  const value = 'test-value';

  // When
  context.provide(key).as(value);

  // Then
  t.deepEqual(await context.resolveAll(() => true), [value]);
  t.deepEqual(await context.resolveAll(() => false), []);
});
