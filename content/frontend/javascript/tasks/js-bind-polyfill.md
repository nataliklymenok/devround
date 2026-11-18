---
id: js-bind-polyfill
order: 6
title: Implement Function.prototype.bind
levels: [middle, senior]
difficulty: medium
estimatedMinutes: 20
mode: tests
topics: [js-this, js-prototypes-classes]
references:
  - { title: 'MDN — Function.prototype.bind()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind' }
  - { title: 'MDN — new.target', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target' }
hints:
  - Return a regular function that calls fn.apply(thisArg, [...presetArgs, ...callArgs]).
  - When the bound function is called with new, bind ignores thisArg — check new.target.
  - With new, call Reflect.construct(fn, args) so the created object gets fn's prototype — not the bound wrapper's.
entry: myBind
starterCode: |
  // Implement as a standalone function: myBind(fn, thisArg, ...presetArgs)
  function myBind(fn, thisArg, ...presetArgs) {
    // your code
  }
tests:
  - name: binds this
    code: |
      function getName() { return this.name }
      const bound = myBind(getName, { name: 'Ann' })
      assert.equal(bound(), 'Ann')
  - name: prepends preset arguments (partial application)
    code: |
      const add = (a, b, c) => a + b + c
      assert.equal(myBind(add, null, 1, 2)(3), 6)
  - name: ignores a different this at call time
    code: |
      function getName() { return this.name }
      const bound = myBind(getName, { name: 'Ann' })
      const other = { name: 'Bob', bound }
      assert.equal(other.bound(), 'Ann')
  - name: returns the function result
    code: |
      const bound = myBind(function () { return [this.x, ...arguments] }, { x: 1 }, 2)
      assert.deepEqual(bound(3), [1, 2, 3])
  - name: works with new and ignores thisArg
    code: |
      function Point(x, y) { this.x = x; this.y = y }
      const BoundPoint = myBind(Point, { ignored: true }, 1)
      const p = new BoundPoint(2)
      assert.ok(p instanceof Point)
      assert.deepEqual([p.x, p.y], [1, 2])
naiveSolution: |
  function myBind(fn, thisArg, ...presetArgs) {
    return (...args) => fn.apply(thisArg, [...presetArgs, ...args])
  }
---

## Problem

Implement `myBind(fn, thisArg, ...presetArgs)`, a standalone version of `Function.prototype.bind`:

- the returned function calls `fn` with `this` fixed to `thisArg` and `presetArgs` prepended;
- calling it with `new` ignores `thisArg` and constructs an instance of `fn`.

## Constraints

Do not use `Function.prototype.bind`.

## Examples

```js
const greet = function (greeting) { return `${greeting}, ${this.name}` }
const hiAnn = myBind(greet, { name: 'Ann' }, 'Hi')
hiAnn() // 'Hi, Ann'
```

## Solution

```js
function myBind(fn, thisArg, ...presetArgs) {
  return function bound(...args) {
    const allArgs = [...presetArgs, ...args]
    // With new: ignore thisArg and build an instance of fn (fn.prototype), like native bind
    if (new.target) return Reflect.construct(fn, allArgs, new.target === bound ? fn : new.target)
    return fn.apply(thisArg, allArgs)
  }
}
```

## Explanation

A regular function closes over `fn`, `thisArg` and `presetArgs` and forwards everything with
`apply`. `new.target` is defined only when the function is called with `new`; in that case native
`bind` ignores the bound `this`, so we construct `fn` with the combined arguments instead. The third
argument of `Reflect.construct` decides the new object's prototype: for a direct `new bound()` it must
be `fn` (passing `bound` would give the object `bound.prototype`, so `instanceof fn` would fail);
for a subclass of the bound function we pass the subclass through.

## Complexity

O(k) per call for k arguments.

## Common mistakes

- Returning an arrow function (the naive version): arrows cannot be called with `new`, so
  `new BoundPoint()` throws.
- Forgetting preset arguments or appending them after call arguments.
- `Reflect.construct(fn, args, new.target)` for a direct `new bound()` — the instance gets the
  wrapper's prototype and `instanceof fn` becomes false.
- Patching `Function.prototype` in shared code — fine in an interview, risky in real projects.
