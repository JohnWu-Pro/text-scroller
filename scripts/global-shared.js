'use strict';

// `self` may be used to refer to the global scope that will work not only
// in a window context (self will resolve to window.self) but also
// in a worker context (self will then resolve to WorkerGlobalScope.self)

const HREF_BASE = hrefBase(location)
const CONTEXT_PATH = contextPath(location)

function delay(millis, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), millis))
}

function hrefBase(location) {
  return location.href.substring(0, location.href.lastIndexOf('/'))
}

function contextPath(location) {
  return location.pathname.substring(0, location.pathname.lastIndexOf('/'))
}

function versionOf(script) {
  return (new URL(script.src).search ?? '').replace(/^\?(?:v=)?/, '')
}

function resolveNavigatorLocale() {
  return navigator.language.replace(/^([a-z]{2})(?:-[a-z]+)??-([A-Z]{2})$/, '$1-$2')
}

function isPlainObject(value) {
  return value?.constructor === Object
}

/**
 * Deep copy the source plain object, any non-plain object reference in the object graph will be simply copied.
 *
 * @param source the plain object
 * @returns a new plain object if the source is a plain object; otherwise, the source itself
 */
Object.copy = function(source) {
  if(!isPlainObject(source)) return source

  const result = {}
  for(const key in source) {
    result[key] = Object.copy(source[key])
  }
  return result
}

function propertyOf(object, key) {
  return {
    get: () => object[key],
    set: (value) => object[key] = value
  }
}