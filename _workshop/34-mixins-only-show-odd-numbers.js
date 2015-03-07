---
layout: workshop
collection: workshop
title: Mixins - only show odd numbers
section: 3
name: 34-mixins-only-show-odd-numbers
next: 35-mixins-immutable-js-should-component-update
slides: http://omniscientjs.github.io/workshop-talk
---

var OnlyShowOddNumbers = {
  shouldComponentUpdate: function (nextProps) {
    return nextProps.number % 2 !== 0;
  }
};

var Numbers = React.createClass({
  render: function () {
    return <div>
      <AllNumbers number={this.props.number} />
      <OddNumbers number={this.props.number} />
    </div>;
  }
});

var AllNumbers = React.createClass({
  render: function () {
    return <div>{this.props.number}</div>;
  }
});

var OddNumbers = React.createClass({
  mixins: [OnlyShowOddNumbers],
  render: function () {
    return <div>{this.props.number}</div>;
  }
});

var n = 0;
setInterval(function () {
  React.render(React.createElement(Numbers, { number: n++ }), el);
}, 1000);
