import autobind from 'autobind-decorator';
import Promise from 'bluebird';
import isCallable from 'is-callable';
import DependencyError from './error';
import Provider from './provider';

/**
 * @class
 */
class Context {
  static _repo = {};

  /**
   * Finds a context instance with the given name and return it.
   * Returns `undefined` if not found.
   *
   * @param {string} name The context's name.
   * @returns {(Context|undefined)} The context instance.
   */
  static get(name) {
    return Context._repo[name];
  }

  /**
   * Removes a context instance with the given name from the repository.
   *
   * @param {string} name The context's name.
   */
  static delete(name) {
    delete Context._repo[name];
  }

  /**
   * Creates new context instance.
   *
   * @param {string} name The context's name. This can be later used to fetch the instance from the repository.
   *                      See {@link Context.get}, and {@link Context.delete}
   */
  constructor(name) {
    this.name = name;

    if (name) {
      Context._repo[name] = this;
    }
  }

  _providers = {};

  /**
   * Creates and returns a new provider instance.
   * The instance will be used as a provider for the dependency with the `key`.
   * That is, when resolving dependency with the `key`, the returned provider will be used.
   * See {@link Provider} API to customize provision settings.
   *
   * @param {string} key The key to register the provider.
   * @returns {Provider} The new provider instance.
   *
   * @example
   * context.provide('logger').as(console.log);
   */
  @autobind
  provide(key) {
    const provider = new Provider(this);
    this._providers[key] = provider;
    return provider;
  }

  /**
   * Finds and returns the depedency with the given `key`.
   *
   * @param {string} key The dependency's key.
   * @returns {Promise<any>} The resolved dependency.
   * @throws {DependencyError} Throws when no valid provider has been registered for the `key`.
   *
   * @example
   * context.resolve('logger').then(log => log('Hello world'));
   */
  @autobind
  resolve(key) {
    const provider = this._providers[key];

    if (provider === undefined) {
      return Promise.reject(new DependencyError(`Cannot find provider for: ${key}`));
    } else {
      return Promise.resolve(provider.get());
    }
  }

  /**
   * Resolves any dependencies that match the given condition.
   *
   * @param {Condition} [cond] The condition to match.
   * @return {Promise<any[]>} The dependencies matching the condition.
   *
   * @example
   * context.resolveAll(['log', 'debug']).then(([log, debug]) => {
   *   debug('Print greeting message');
   *   log('Hello world');
   * });
   */
  @autobind
  resolveAll(cond) {
    if (Array.isArray(cond)) {
      return Promise.resolve(cond)
        .map(c => this.resolveAll(c))
        .reduce((acc, item) => [...acc, ...item], [])
        .filter(values => !!values);
    }

    if (cond instanceof RegExp) {
      return Promise.resolve(Object.keys(this._providers))
        .filter(key => cond.test(key))
        .map(key => this.resolve(key))
        .filter(values => !!values);
    }

    if (isCallable(cond)) {
      return Promise.resolve(Object.keys(this._providers))
        .filter(cond)
        .map(key => this.resolve(key))
        .filter(values => !!values);
    }

    if (cond === undefined || cond === true) {
      return Promise.resolve(Object.keys(this._providers))
        .map(key => this.resolve(key))
        .filter(values => !!values);
    }

    if (cond === null || cond === false) {
      return Promise.resolve([]);
    }

    return this.resolve(cond)
      .then(value => [value])
      .filter(values => !!values);
  }

  /**
   * Wraps function to automatically resolve dependencies and inject into arguments.
   *
   * @param {Condition} cond
   * @param {Function} consumer
   *
   * @example
   * const greet = context.using(['log', 'debug'], (log, debug, name) => {
   *   debug('Print greeting message');
   *   log(`Hello ${name}`);
   * });
   *
   * greet('world');
   */
  @autobind
  using(cond, consumer) {
    return (...ownArgs) => this.resolveAll(cond).then(values => consumer(...values, ...ownArgs));
  }
}

export default Context;
