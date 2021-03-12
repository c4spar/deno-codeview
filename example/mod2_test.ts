import { bar2, baz2, foo2 } from "./mod2.ts";

Deno.test({
  name: "foo2",
  fn() {
    foo2();
    foo2();
  },
});

Deno.test({
  name: "bar2",
  fn() {
    bar2();
    bar2();
  },
});

Deno.test({
  name: "baz2",
  fn() {
    baz2();
    baz2();
  },
});
