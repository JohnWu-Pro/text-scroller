'use strict';

class LabelledSwitch extends HTMLInputElement {
  static get observedAttributes() {
    return [
      'on-label', 'on-value',
      'off-label', 'off-value',
      'value'
    ]
  }

  static useInlineStyle = false

  static #INPUT = 0
  static #COMPANION = 1
  static #styles = [
    {
      appearance: 'none',
      '-webkit-tap-highlight-color': 'transparent',
      background: 'none',
      position: 'relative',
      display: 'inline-block',
      outline: 'none',
      margin: '0px',
      border: 'none',
      cursor: 'pointer',
      'vertical-align': 'middle',
    }, {
      display: 'inline-block',
      position: 'relative',
      overflow: 'visible',
      width: '0px',
      'vertical-align': 'middle',
    }
  ]
  static #template

  static register() {
    if(! LabelledSwitch.useInlineStyle) {
      document.head.appendChild(LabelledSwitch.#styleElement(`
        /* Using fake ID selectors to increase CSS declaration specificity */
        :not(#fake-id-1#fake-id-2#fake-id-3) > input[is="labelled-switch"].style-captured ${LabelledSwitch.#cssTextOf(
          LabelledSwitch.#styles[LabelledSwitch.#INPUT]
        )}
        :not(#fake-id-1#fake-id-2#fake-id-3) > span.labelled-switch-companion ${LabelledSwitch.#cssTextOf(
          LabelledSwitch.#styles[LabelledSwitch.#COMPANION]
        )}
      `.replaceAll(/        /g, '')))
    }

    const template = document.body.appendChild(document.createElement('template'))
    template.id = 'labelled-switch-template'
    template.innerHTML = `
      <span class="container">
        <span id="button-container">
          <span id="button"></span>
        </span>
        <span class="edge-pad"></span>
        <span class="label" id="on"></span>
        <span class="middle-pad"></span>
        <span class="label" id="off"></span>
        <span class="edge-pad"></span>
      </span>
    `.replaceAll(/\n\s+/g, '')

    LabelledSwitch.#template = template.content
    // console.debug("[DEBUG] LabelledSwitch.#template: %o", LabelledSwitch.#template)

    customElements.define('labelled-switch', LabelledSwitch, {extends: 'input'})
  }

  static #cssTextOf(style) {
    return JSON.stringify(style, null, '  ')
        .replaceAll(/\n}/g, ',\n}')
        .replaceAll(/"/g, '')
        .replaceAll(/,/g, ';')
  }

  static #Style = (() => {
    const properties = Object.freeze({
      'background-color': 'rgba(0, 0, 0, 0)',

      'border-color': 'rgb(0, 0, 0)',
      'border-style': 'none',
      'border-width': '0px',

      'color': 'rgb(0, 0, 0)',

      'outline-color': 'rgb(0, 0, 0)',
      'outline-style': 'none',
      'outline-width': '0px',
    })

    function capture(checkbox) {
      const styles = [], SELECTED = 0, DEFAULT = 1

      checkbox.type = 'text' // So that the border style can fall back to that of the text input
      styles.push(getComputed(project(properties, ['background-color', 'color']), checkbox, '::selection'))
      styles.push(getComputed(properties, checkbox))

      // console.debug("[DEBUG] input[name=%o] computed-styles:\n=== ::selection: %s\n=== :default: %s\n=== :parent: %s",
      //     checkbox.name, JSON.stringify(styles[0]), JSON.stringify(styles[1]), JSON.stringify(styles[2]))

      function get(beginIndex, key) {
        let style = ''
        for(let index = beginIndex; index < styles.length; index++) {
          style = styles[index][key]
          if(style !== properties[key]) return style
        }
        return style
      }

      return {
        'border-color': get(DEFAULT, 'border-color'),
        'border-style': get(DEFAULT, 'border-style'),
        'border-width': get(DEFAULT, 'border-width'),
        'default-background-color': get(DEFAULT, 'background-color'),
        'default-color': get(DEFAULT, 'color'),
        'selected-background-color': get(SELECTED, 'background-color'),
        'selected-color': get(SELECTED, 'color'),
        'outline-color': get(DEFAULT, 'outline-color'),
        'outline-style': get(DEFAULT, 'outline-style'),
        'outline-width': get(DEFAULT, 'border-width'),
      }
    }

    function getComputed(props, element, pseudoElement) {
      const computed = window.getComputedStyle(element, pseudoElement)
      const style = {}
      for(const prop in props) {
        style[prop] = computed[camelize(prop)]
      }
      return style
    }

    function camelize(hyphenized) {
      return hyphenized
        .split('-')
        .map((word, i) => i===0 ? word : word[0].toUpperCase() + word.substring(1))
        .join('')
    }

    function project(object, keys) {
      let projected = {}
      for(let key of keys) {
        projected[key] = object[key];
      }
      return projected;
    }

    return {capture}

  })()

  static #noneSizeStyle(style) { return LabelledSwitch.#styleElement(`
span {
  position: relative;
  display: inline-block;
  white-space: nowrap;
  vertical-align: top;
}
.container {
  background-color: ${style['default-background-color']};
  border: ${style['border-width']} ${style['border-style']} ${style['border-color']};
  outline: none;
  outline-offset: 0;
}
.container.focused {
  outline: ${style['outline-color']} ${style['outline-style']} ${style['outline-width']};
}
#button-container {
  overflow: visible;
  width: 0;
}
#button {
  background-color: ${style['selected-background-color']};
  border: none;
  top: 1px;
  transition: 
    left .3s cubic-bezier(.5,.1,.75,1.35),
    width .3s cubic-bezier(.5,.1,.75,1.35);
}
.label {
  color: ${style['default-color']};
  transition: color .3s cubic-bezier(.5,.1,.75,1.35);
}
.label.selected {
  color: ${style['selected-color']};
}
`)}

  static #sizingStyle(size, checked) { return LabelledSwitch.#styleElement(`
span.container {
  border-radius: ${size.netHeight/2+size.borderWidth}px;
}
span#button {
  border-radius: ${(size.netHeight-2)/2}px;
  height: ${size.netHeight-2}px;` + (checked===true ? `
  left: 1px;
  width: ${size.onWidth + size.padWidth * 2 - 2}px;
}
span#button:not(.checked) {
  width: ${size.offWidth + size.padWidth * 2 - 2}px;
  left: ${size.onWidth + size.padWidth * 1.5 + 1}px;
}` : /* else, un-checked */ `
  left: ${size.onWidth + size.padWidth * 1.5 + 1}px;
  width: ${size.offWidth + size.padWidth * 2 - 2}px;
}
span#button.checked {
  width: ${size.onWidth + size.padWidth * 2 - 2}px;
  left: 1px;
}`) + `
span.container > .edge-pad {
  width: ${size.padWidth}px;
}
span.container > .middle-pad {
  width: ${size.padWidth * 1.5}px;
}
`)}

  static #styleElement(content) {
    // console.debug("[DEBUG] Calling #styleElement(%s) ...", content)
    const element = document.createElement('style')
    element.textContent = content
    return element
  }

  // static #rgba(color, alpha = 1.0) {
  //   const matches = [...color.matchAll(/rgb\((\d+), ?(\d+), ?(\d+)\)/g)]
  //   const [_, r, g, b] = [...matches[0]]
  //   return `rgba(${r}, ${g}, ${b}, ${alpha})`
  // }

  #shadow
  #$button
  #$sizingParts = {
    off: undefined,
    on: undefined,
  }
  #style

  #attached = false
  #initialized = false

  offValue
  onValue

  constructor() {
    super()

    // this :: the <input is="labelled-switch">
    this.#style = LabelledSwitch.#Style.capture(this)
    // console.debug("[DEBUG] input[name=%o] captured style: %s", this.name, JSON.stringify(this.#style))

    this.type = 'checkbox'
    if(LabelledSwitch.useInlineStyle) {
      Object.assign(this.style, LabelledSwitch.#styles[LabelledSwitch.#INPUT])
    } else {
      this.classList.add('style-captured')
    }

    this.#shadow = this.insertAdjacentElement('beforebegin', document.createElement('span')).attachShadow({mode: 'open'})

    // this.#shadow.host :: the companion <span>
    if(LabelledSwitch.useInlineStyle) {
      Object.assign(this.#shadow.host.style, LabelledSwitch.#styles[LabelledSwitch.#COMPANION])
    } else {
      this.#shadow.host.classList.add('labelled-switch-companion')
    }

    const fragment = LabelledSwitch.#template.cloneNode(true)
    fragment.prepend(LabelledSwitch.#noneSizeStyle(this.#style))
    this.#shadow.appendChild(fragment)

    this.#$button = this.#shadow.querySelector('#button')
    Object.keys(this.#$sizingParts).forEach((id) => this.#$sizingParts[id] = this.#shadow.querySelector('#'+id))

    this.addEventListener('change', this.#onCheckedChanged)

    const container = this.#shadow.querySelector('.container')
    this.addEventListener('focus', () => container.classList.add('focused'))
    this.addEventListener('blur', () => container.classList.remove('focused'))
  }

  connectedCallback() {
    // console.debug("[DEBUG] Calling [name=%s].connectedCallback() [isConnected: %o] ...", this.name, this.isConnected)
    if(this.isConnected) this.#attached = true
    this.#onAttributeChanged()
  }

  disconnectedCallback() {
    // console.debug("[DEBUG] Calling disconnectedCallback() ...")
    this.#attached = false
  }

  adoptedCallback() {
    // console.debug("[DEBUG] Calling adoptedCallback() ...")
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // console.debug("[DEBUG] Calling [name=%s].attributeChangedCallback(%s, %o, %o) ...", this.name, name, oldValue, newValue)
    this.#onAttributeChanged(name)
  }

  #onAttributeChanged(name) {
    if(!this.#attached || this.#initialized) {
      if(this.#initialized && name === 'value') this.#onValueChanged()
      return
    }
    // console.debug("[DEBUG] Executing [name=%s].#onAttributeChanged() ...", this.name)

    this.offValue = this.getAttribute('off-value') || 'off'
    this.onValue = this.getAttribute('on-value') || 'on'

    if(this.value !== this.onValue && this.value !== this.offValue) {
      // Fall back to off-value
      this.value = this.offValue
    }
    this.checked = this.value === this.onValue

    this.#$sizingParts.off.innerHTML = this.getAttribute('off-label') || 'Off'
    this.#$sizingParts.on.innerHTML = this.getAttribute('on-label') || 'On'

    const boxSizes = {}
    Object.values(this.#$sizingParts).forEach((part) => this.#observeResizing(boxSizes, part))
  }

  #observeResizing(boxSizes, element) {
    // console.debug("[DEBUG] Observing resizing [id=%s] ...", element.id)
    new ResizeObserver((entries, observer) => {
      const entry = entries.pop()
      // console.debug("[DEBUG] Observed [id=%s]: %o", entry.target.id, entry)
      boxSizes[entry.target.id] = entry.contentBoxSize[0]

      observer.disconnect()

      if(Object.keys(boxSizes).length === Object.keys(this.#$sizingParts).length) {
        this.#onSizeUpdated(boxSizes)
      }
    }).observe(element)
  }

  #onSizeUpdated(boxSizes) {
    // console.debug("[DEBUG] Calling [name=%s].#onSizeUpdated(): %o", this.name, boxSizes)
    const netHeight = boxSizes.on.blockSize
    const borderWidth = Number(((s) => s.substring(0, s.length-2))(this.#style['border-width']))
    const offWidth = boxSizes.off.inlineSize
    const onWidth = boxSizes.on.inlineSize
    const padWidth = netHeight * 0.5
    const totalHeight = borderWidth * 2 + netHeight
    const totalWidth = borderWidth * 2 + offWidth + onWidth + padWidth * 3.5

    Object.assign(this.style, {
      height: totalHeight+'px',
      width: totalWidth+'px',
    })

    // console.debug("[DEBUG] Rendering [name=%s] sizing sytle (checked: %o) ...", this.name, this.checked)
    this.#shadow.appendChild(LabelledSwitch.#sizingStyle(
      {borderWidth, netHeight, offWidth, onWidth, padWidth, totalHeight, totalWidth}, this.checked
    ))
    this.#initialized = true

    this.#updateSwitch()
  }

  #onCheckedChanged() {
    this.value = this.checked ? this.onValue : this.offValue

    this.#updateSwitch()
  }

  #onValueChanged() {
    this.checked = this.value === this.onValue

    this.#updateSwitch()
  }

  #updateSwitch() {
    this.#$button.classList.toggle('checked', this.checked)

    this.#$sizingParts.off.classList.toggle('selected', !this.checked)
    this.#$sizingParts.on.classList.toggle('selected', this.checked)
  }
}

//
// Initialize
//
document.addEventListener("DOMContentLoaded", LabelledSwitch.register)
