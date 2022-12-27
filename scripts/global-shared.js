'use strict';

// `self` may be used to refer to the global scope that will work not only
// in a window context (self will resolve to window.self) but also
// in a worker context (self will then resolve to WorkerGlobalScope.self)

const HREF_BASE = hrefBase(location)
const CONTEXT_PATH = contextPath(location)

const {APP_BASE, LOCALE} = ((base) => {
  let LOCALE = resolveNavigatorLocale()

  if(base.endsWith('/' + LOCALE)) {
    return {APP_BASE: base.substring(0, base.length - (LOCALE.length+1)), LOCALE}
  } else if(LOCALE.length > 2) {
    LOCALE = LOCALE.substring(0, 2)
    if(base.endsWith('/' + LOCALE)) {
      return {APP_BASE: base.substring(0, base.length - (LOCALE.length+1)), LOCALE}
    }
  }
  return {APP_BASE: base, LOCALE: ''}
})(HREF_BASE)

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

const PlainObject = {
  /**
  * Check if the value is a plain object
  *
  * @param value the value to be checked
  * @returns true if the value is a plain object, false otherwise
  */
  is(value) { return value?.constructor === Object },

  /**
  * Deep copy the source plain object, any non-plain object reference in the source object's properties graph/hierarchy will be simply copied.
  *
  * @param source the source object
  * @returns a new plain object if the source is a plain object; otherwise, the source itself
  */
  copy(source) { return this.merge(source) },

  /**
  * Deep merge the source plain object to the target object, any non-plain object reference in the source object's properties graph/hierarchy will be simply copied to the target.
  *
  * @param source the source object
  * @param target the target object
  * @returns the source object itself if it's a non-plain object; 
  *          otherwise, the target object with its properties graph/hierarchy being overriden from the source object's properties graph/hierarchy.
  */
  merge(source, target = {}) {
    if(!this.is(source)) return source

    for(const key in source) {
      target[key] = this.merge(source[key], target[key])
    }
    return target
  }
}
