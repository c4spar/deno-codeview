import { bar, baz, foo } from "./mod.ts";

Deno.test({
  name: "foo",
  fn() {
    foo();
    foo(true);
    foo();
  },
});

Deno.test({
  name: "bar",
  fn() {
    bar();
    bar();
    bar();
    bar();
  },
});

Deno.test({
  name: "baz",
  fn() {
    baz();
    baz();
  },
});
