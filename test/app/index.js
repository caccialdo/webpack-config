import React from 'react'
import ReactDOM from 'react-dom'
import _flow from 'lodash/flow'

import Paragraph from './components/paragraph'
import Span from './components/span'

const addSquared = _flow((a, b) => a + b, a => Math.pow(a, 2))

ReactDOM.render(
  <div>
    <Span>hello</Span>
    <Paragraph>world: {addSquared(1, 3)}</Paragraph>
  </div>,
  document.getElementById('app')
)
