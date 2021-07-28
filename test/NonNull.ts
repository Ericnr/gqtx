import { createTypesFactory } from '../src';

type Context = {};
const t = createTypesFactory<Context>();

type User = { id: number };

const user = t.objectType<User>({
  name: 'User',
  fields: () => [
    t.field('id', {
      // I have no way to automatically infer whether its an input NonNull and an Output NonNull
      // so I have to pass it an argument
      type: t.NonNull<number, false>(t.Int),
      args: {
        add: t.arg(t.NonNull<number, true>(t.Int)),
      },
      resolve: (u, { add }) => u.id + add,
    }),
  ],
});
