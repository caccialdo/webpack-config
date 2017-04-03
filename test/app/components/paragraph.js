import React, { Component } from 'react'

export default class extends Component {
  render () {
    return (
      <p>{ this.props.children }</p>
    )
  }
}
