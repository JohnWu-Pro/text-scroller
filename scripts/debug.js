'use strict';

(function() {

if(! location.href.match(/\bdebug\b/gi)) return

function show() {
  appendElement('div', {id: 'debug'}).innerHTML = `
    <hr/>
    <div>Display mode: ${new URL(location.href).searchParams.get('mode')}</div>
    <div>navigator.language: ${navigator.language}</div>
  `
}

document.addEventListener("DOMContentLoaded", show)

})()
