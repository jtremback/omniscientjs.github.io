---
layout: guides
collection: tutorials
title: Editing Basic Tutorial Creating List with Live Filtering - JSX Edition
name: 02-editing-basic-tutorial-creating-list-with-live-filtering-jsx-edition
prev: 01-editing-basic-tutorial-creating-list-with-live-filtering
---

**Disclaimer: This tutorial is currently for Omniscient <code>v2.0.0</code> and is in the process of being updated to match the new syntax of Immutable.js 3.0.0 and Omniscient 3.0.0. See the [changelog](http://omniscientjs.github.io/changelog/)**

If you haven't read the Omniscient introduction article yet, you should probably [read it before you get started](/guides/01-simpler-ui-reasoning-with-unidirectional) on this tutorial. The previous article in this series introduces the concepts and architecture. In this example we will see how we can use [React](https://github.com/facebook/react), [Omniscient.js](https://github.com/omniscientjs/omniscient), and [Immutable.js](https://github.com/facebook/immutable-js) a rudimentary search filtering of javascript libraries and frameworks. You can see a [running demo on the playground](http://omniscientjs.github.io/playground/02-search/). After we've implemented the example, we'll look into how we can debug an Omniscient application, and see what components get re-rendered.

For this example, we're creating a small application where we can search for different javascript libraries and frameworks from a list. We should start by requiring the modules we want to use. A basic stack with Omniscient consists of React, immstruct (which wraps Immutable.js) and of course Omniscient itself.

```jsx
var React     = require('react'),
    immstruct = require('immstruct'), // wrapped Immutable.js
    omniscient = require('omniscient');

// Activate JSX "always mode". Every component made through
// component() will be JSX Elements not created "component" (React 0.12 change)
var component = omniscient.withDefaults({
  jsx: true
});
```

To show a list of different javascript projects, we should have a top structure with our data defined as a immutable structure. We need a list of different projects and their URLs, but also a string which will be the current search query, that will behave as an active filter. The entire application state is defined in that structure alone. If we wanted, we could have started the application with a predefined search instead of an empty string – making it easier to test and demo.

```jsx
var structure = immstruct({
  search: '',
  libs: [
    { title: 'Backbone.js', url: 'http://documentcloud.github.io/backbone/' },
    { title: 'AngularJS', url: 'https://angularjs.org/' },
    { title: 'jQuery', url: 'http://jquery.com/' },
    { title: 'Prototype', url: 'http://www.prototypejs.org/' },
    { title: 'React', url: 'http://facebook.github.io/react/' },
    { title: 'Omniscient', url: 'https://github.com/omniscientjs/omniscient' },
    { title: 'Ember', url: 'http://emberjs.com/' },
    { title: 'Knockout.js', url: 'http://knockoutjs.com/' },
    { title: 'Dojo', url: 'http://dojotoolkit.org/' },
    { title: 'Mootools', url: 'http://mootools.net/' },
    { title: 'Underscore', url: 'http://documentcloud.github.io/underscore/' },
    { title: 'Lodash', url: 'http://lodash.com/' },
    { title: 'Moment', url: 'http://momentjs.com/' },
    { title: 'Express', url: 'http://expressjs.com/' },
    { title: 'Koa', url: 'http://koajs.com' },
  ]
});
```

We could also load the data lazily. This is an operation that shouldn't be a part of our UI, but rather of a separate module handling models and collections. We could send a cursor to where we want the data populated, using Immutable.js. For instance:

```jsx
var storage = require('./storage');

var structure = immstruct({
  search: '',
  libs: [ ]
});

// fetchLibraries could use AJAX; it swaps the empty libs list
// in our structure to a new one containing the new models.
storage.fetchLibraries(structure.cursor('libs'));
```

There would't be any need for doing anything else: if our `fetchLibraries` method swapped the value in our structure, we would get an event from `immstruct` telling us that a value has been swapped in the data structure. We should re-render if this happens.

The code for rendering the application starts like this:

```jsx
function render () {
  React.render(
    <Search cursor={structure.cursor()} />,
    document.body
  );
}

render();
structure.on('swap', render);
```

Remember, `structure` is the immutable structure we created to hold the application data. It emits event, `swap` (this feature comes from immstruct), when this event is emitted; in response, we will want to re-render the entire component tree, starting with a top parent component. Let's call it `Search` in this example.

Note, as we have used `omniscient.withDefaults({ jsx: true})`, there is no need to explicitly set JSX version of components. If we didn't have JSX-mode activated, we'd have to access the JSX Component like `Search.jsx`. This is to get the actual component, and not the returned element. JSX compiles this file and converts the Component to an element, but when you use Omniscient with JSX, you need to retrieve the actual React component, hence the suffix. Having set jsx-mode to true for component, we won't have to think more about this. This is a local change however. If you require omniscient in another file, this change won't transfer. You'd also can't create non-jsx components with this jsx-mode activated. If you are making open source components, it would be natural to return a JSX Component for best interoperability.

Now, let us start implementing `Search`, which will consist of a `SearchBox` and a set of `Matches`. This is pretty straightforward: we are simply making HTML elements and describing our view in a declarative way, using components. Much like doing… HTML markup:

```jsx
var Search = component('Search', ({cursor}) => (
  <div>
    <SearchBox cursor={cursor.cursor('search')} />
    <Matches cursor={cursor} />
  </div>
));
```

As we see, a component is created using Omniscient's `component` function. Its first argument is a string representation of the component and is used for debugging as well as the component's name in React. The second argument is the component implementation itself, provided as a function. This function is a render* function: it returns a React element (here, a div). When a component should render, this *render function is executed, and its return value will be the representation of the component. The render function of a component is passed a cursor, which is the cursor a parent component (or the top renderer) is serving. In our case, `Search` being the top-level component, it will get passed an object literal with a property of our cursor to the entire application state: `structure.cursor()`, as defined in our main `render` helper function above.

As we can see, `Search` is a small component that actually outputs a combination of two sub-components: `SearchBox` and `Matches`. The empty object as first argument to the React div-element is HTML metadata to the div. We see that `Matches` gets the same cursor `Search` has (a cursor to the entire structure), as it needs a representation of the entire state, but `SearchBox` only needs information about the search query, hence the "sub-cursor" to "search" (it should not concern itself with how the list is stored, handled or what it contains).

The next natural step is to list out all the matches based on the search query, which is the main feature of our application. We don't have any way of altering the search query yet, but that doesn't matter. We have the search query as a value inside our global application state, and with it being empty, we should list out *all* our javascript projects.

A list of matches consist in a list of `Match` components. `Match` will be a component that merely presents a javascript library as a list item, with an anchor-element to open the library's homepage, like so:

```jsx
// Note: We use destructuring to get property: props.cursor
var Match = component('Match', ({cursor}) => (
  <li>
    <a href={cursor.get('url')}>{cursor.get('title')}</a>
  </li>
));
```

Note: Here we use ES2015 destructuring to get value `props.cursor`. Alternativly, without destructuring and ES2015 features, we could do:

```jsx
// Note: We use destructuring to get property: props.cursor
var Match = component('Match', function (props) {
  var cursor = props.cursor;
  return (
    <li>
      <a href={cursor.get('url')}>{cursor.get('title')}</a>
    </li>
  );
});
```

But as you'll see, the ES2015 syntax is shorter and more concise.


The `Matches` component (the list of matches) is far more interesting, and is the heart of the application. To do its work, it needs: the search query, the list of projects, and a way to filter the projects based on the search query. The matches should be presented to the browser as an un-ordered list of elements.

```jsx
// Getting cursor from props.cursor through destructuring
var Matches = component('Matches', function ({cursor}) {

  // Get the value from search query
  var q = cursor.get('search');

  // Get all projects
  var libs = cursor.get('libs');

  // Get all javascript projects that matches the query
  var matches = libs.filter(function (lib) {
    return lib.get('title').indexOf(q) !== -1 || lib.get('url').indexOf(q) !== -1;
  });

  // Present the matches
  return (
    <ul>
      {matches.toArray().map(function (lib, i) {
        return (
          <Match key={'match-' + lib.get('title')}
            cursor={lib} />
        );
      })}
    </ul>
  );
});
```

Even this, the main part of our application, shouldn't do anything that is not related to the presentation. We only want to present the items that match our search query, so we filter the list of libraries to select those that contains our search query (either in the name or the URL) and present them in the returned element. If we try to change our initial search query, like so:

```jsx
var structure = immstruct({
  search: 'Omniscient',
  // ...
});
```

... and refresh the browser, we would see only the Omniscient library being presented in the list. And every time we refresh the browser, this is what we would see. Pure, predictable components.

Ok, but altering the source code and refreshing the browser isn't really user friendly - nor fast. We should create a separate component for updating the search query, the infamous search box:

```jsx
var SearchBox = component('SearchBox', ({cursor}) => (
  <div>
    <input placeholder="Search.."
           value={cursor.deref()}
           onChange={this.changeHandler} />
  </div>
));
```

The `SearchBox` component should be an easy one, but we can see two things here that might be new. The cursor we get passed in the props is a cursor that *directly* references the search string. To get that string, for there is no `get` function as we used earlier (to get nested properties), we instead need to de-reference the cursor by calling `props.cursor.deref()`. Another thing here is the `changeHandler`. We have seen an event handler previously, but not the `onChange` thing. `onChange` is triggered every time the input is changed (but not blurred, as one might expect).

Let's create a small mixin that can handle this kind of change for us. As this is javascript and we have lexical scoping, we can easily share a context with the component through `this` when using the mixin from within the component. The passed cursor will be available through the property `this.props.cursor` inside the mixin, as expected, and in that case, the cursor points directly to the search query in the structure, so we can update it right away:

```jsx
var mixins = {
  changeHandler: function (e) {
    this.props.cursor.update(function (currentSearch) {
      // We don't actually need the current value (currentSearch),
      // let's just replace it!
      return e.currentTarget.value;
    });
  }
};

// Change our SearchBox from above to add the mixins
var SearchBox = component('SearchBox', mixins,
  ({cursor}) => ( /* same as before */ ));
```

The `changeHandler` has one small job: to update the cursor with the new value of the input box. This will swap the search query in the immutable structure and, through immstruct's swap event, tell the application to re-render.

That is it! That, is our entire live filter application. It is pretty awesome and really easy to reason about - almost as simple as HTML itself. Check out the [complete source code in the Playground](http://omniscientjs.github.io/playground/02-search/) (non-JSX).

To wrap it up, let's review what is *happening* here. What does *happen* when we re-render? And, just for the sake of it, how do we debug things?

### Analyzing re-renders

The re-render process is interesting. We will go through it, top-down, to see if the components have changed and how the react. So, when a new input is registered in our text field, the `onChange` handler kicks in and we swap out the search query value in our immutable structure, which causes a "swap" event to be emitted. As we are listening for such events, it triggers a re-render of the root component. Let's check whether the cursor passed to `Search` has changed:

```jsx
React.render(
  <Search cursor={structure.cursor()} />,
  document.body
);
```

It has changed indeed, because the object has changed somehow and this is a cursor to the whole object. So, we actually do a re-render. The component's render function is executed, and as it creates two sub-components, we again check whether `SearchBox` and `Matches`' cursors have changed. Both have changed, as both have access to the search query and the search query has changed, so we trigger a re-render of both components. The search box simply renders out the new updated state to the browser, whereas the `Matches` list generates a new list of sub-components by filtering all javascript projects based on the search query.

We can activate the Omniscient debugger to better see what happens next:

```jsx
// Activate debug-mode
component.debug();
```

While having the debug-mode activated, let's try to go from `e` to `en` in the input box. We should get 4 results. The debug output is:

```
<Search>: shouldComponentUpdate => true (props have changed)
<Search>: render
<SearchBox>: shouldComponentUpdate => true (props have changed)
<SearchBox>: render
<Matches>: shouldComponentUpdate => true (props have changed)
<Matches>: render
<Match key=match-Backbone.js>: shouldComponentUpdate => false
<Match key=match-Omniscient>: shouldComponentUpdate => false
<Match key=match-Underscore>: shouldComponentUpdate => false
<Match key=match-Moment>: shouldComponentUpdate => false
```

We see that all the "top" components are re-rendered (`Search`, `SearchBox` and `Matches`). What is interesting is that not all of the `Match` components are re-rendering. While `Matches` re-renders, it removes several elements that doesn't match our query. The libraries that do match our query are considered for re-rendering but, as they haven't changed, they don't actually re-render - they just remain from the previous render.

If we remove a letter from the search query (making it `e` again), the debug-output for the `Match` component show:

```
<Match key=match-Backbone.js>: shouldComponentUpdate => false
<Match key=match-jQuery>: render
<Match key=match-Prototype>: render
<Match key=match-React>: render
<Match key=match-Omniscient>: shouldComponentUpdate => false
<Match key=match-Ember>: render
<Match key=match-Mootools>: render
<Match key=match-Underscore>: shouldComponentUpdate => false
<Match key=match-Moment>: shouldComponentUpdate => false
<Match key=match-Express>: render
```

We can see that all the components that matched the previous query are still there, unchanged, and only the new components get rendered.

## Summary

This has been a introductory tutorial for how we can use Omniscient and React to make applications. The application we created in this tutorial, was fairly naïve and doesn't face the problems of real life. It is very rare we can have code as clean and small as this, but this shows, at the most basic level, how we can reason about a component based, top-down rendered, UI. It can be challenging at first, to switch out our "normal" way of designing Javascript software, and having a loop that iterates everytime we make a small change. It also might seem like this would be slow and un-optimized, but the smart implementation of React and the reference checks of Omniscient and Immutable.js will actually allow us to create fast, responsive, applications. You can see more examples and try them out live [in the Playground](http://omniscientjs.github.io/playground/).
