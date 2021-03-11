import { bar, baz, foo } from "./mod.ts";

Deno.test({
  name: "foo",
  fn() {
    foo();
  },
});

Deno.test({
  name: "bar",
  fn() {
    bar();
  },
});

Deno.test({
  name: "baz",
  fn() {
    baz();
  },
});
