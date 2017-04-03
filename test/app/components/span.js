import React, { Component } from 'react'

import styles from './span.scss?modules'

export default class extends Component {
  render () {
    return (
      <span className={styles.mySpan}>{ this.props.children }</span>
    )
  }
}
