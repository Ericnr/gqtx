import * as graphql from 'graphql';
import {
  Scalar,
  Enum,
  EnumValue,
  ObjectType,
  InputObject,
  Interface,
  Union,
  InputType,
  OutputType,
  ArgMap,
  TOfArgMap,
  Field,
  AbstractField,
  DefaultArgument,
  Argument,
  InputFieldMap,
  SubscriptionField,
  SubscriptionObject,
} from './types';

function builtInScalar<Src>(builtInType: graphql.GraphQLScalarType): Scalar<Src | null> {
  return {
    kind: 'Scalar',
    builtInType,
  };
}

export function createTypesFactory<Ctx = undefined>() {
  return {
    String: builtInScalar<string>(graphql.GraphQLString),
    Int: builtInScalar<number>(graphql.GraphQLInt),
    Float: builtInScalar<number>(graphql.GraphQLFloat),
    Boolean: builtInScalar<boolean>(graphql.GraphQLBoolean),
    ID: builtInScalar<any>(graphql.GraphQLID),
    IDString: builtInScalar<string>(graphql.GraphQLID),
    IDInt: builtInScalar<number>(graphql.GraphQLID),
    scalarType<Src>({
      name,
      description,
      serialize,
      parseValue,
      parseLiteral,
    }: {
      name: string;
      description?: string;
      serialize: (src: Src) => any | null;
      parseValue?: (value: JSON) => Src | null;
      parseLiteral?: (value: graphql.ValueNode) => Src | null;
    }): Scalar<Src | null> {
      return {
        kind: 'Scalar',
        graphqlTypeConfig: {
          name,
          description,
          serialize,
          parseLiteral,
          parseValue,
        },
      };
    },
    enumType<Src>({
      name,
      description,
      values,
    }: {
      name: string;
      description?: string;
      values: Array<EnumValue<Src>>;
    }): Enum<Src | null> {
      return {
        kind: 'Enum',
        name,
        description,
        values,
      };
    },

    arg<Src>(type: InputType<Src>, description?: string): Argument<Src> {
      return {
        kind: 'Argument',
        type,
        description,
      };
    },
    defaultArg<Src>(
      type: InputType<Src>,
      defaultArg: Exclude<Src, null>,
      description?: string
    ): DefaultArgument<Exclude<Src, null>> {
      return {
        kind: 'DefaultArgument',
        type: type as any,
        description,
        default: defaultArg,
      };
    },
    field<Src, Arg, Out>(
      name: string,
      {
        type,
        args = {} as ArgMap<Arg>,
        resolve,
        description,
        deprecationReason,
      }: {
        type: OutputType<Ctx, Out>;
        args?: ArgMap<Arg>;
        description?: string;
        deprecationReason?: string;
        resolve: (
          src: Src,
          args: TOfArgMap<ArgMap<Arg>>,
          ctx: Ctx,
          info: graphql.GraphQLResolveInfo
        ) => Out | Promise<Out>;
      }
    ): Field<Ctx, Src, any, any> {
      return {
        kind: 'Field',
        name,
        type,
        description,
        deprecationReason,
        args,
        resolve,
      };
    },
    defaultField<Src extends object, K extends keyof Src>(
      name: K,
      type: OutputType<Ctx, Src[K]>,
      opts?: {
        description?: string;
        deprecationReason?: string;
      }
    ): Field<Ctx, Src, any, any> {
      return {
        kind: 'Field',
        name: String(name),
        type,
        description: opts && opts.description,
        deprecationReason: opts && opts.deprecationReason,
        args: {},
        resolve: (src: Src) => src[name],
      };
    },
    abstractField<Out>(
      name: string,
      type: OutputType<Ctx, Out>,
      opts?: {
        description?: string;
        deprecationReason?: string;
      }
    ): AbstractField<Ctx, Out> {
      return {
        kind: 'AbstractField',
        name,
        description: opts && opts.description,
        deprecationReason: opts && opts.deprecationReason,
        type,
      };
    },
    objectType<Src, Ctx = any>({
      name,
      description,
      interfaces = [],
      fields,
      isTypeOf,
    }: {
      name: string;
      description?: string;
      interfaces?: Array<Interface<Ctx, any>>;
      fields: (self: OutputType<Ctx, Src | null>) => Array<Field<Ctx, Src, any>>;
      isTypeOf?: (src: any, ctx: Ctx, info: graphql.GraphQLResolveInfo) => boolean;
    }): ObjectType<Ctx, Src | null> {
      const obj: ObjectType<Ctx, Src | null> = {
        kind: 'ObjectType',
        name,
        description,
        interfaces,
        fieldsFn: undefined as any,
        isTypeOf,
      };

      obj.fieldsFn = () => fields(obj) as any;
      return obj;
    },
    inputObjectType<Src>({
      name,
      description,
      fields,
    }: {
      name: string;
      description?: string;
      fields: (self: InputType<Src | null>) => InputFieldMap<Src>;
    }): InputObject<Src | null> {
      let inputObj: InputObject<Src | null> = {
        kind: 'InputObject',
        name,
        description,
        fieldsFn: null as any,
      };

      inputObj.fieldsFn = () => fields(inputObj);
      return inputObj;
    },
    unionType<Src>({
      name,
      types,
      resolveType,
    }: {
      name: string;
      types: Array<ObjectType<Ctx, any>>;
      resolveType: (src: Src) => ObjectType<any, any>;
    }): Union<Ctx, Src | null> {
      return {
        kind: 'Union',
        name,
        types,
        resolveType,
      } as Union<Ctx, Src | null>;
    },
    interfaceType<Src>({
      name,
      description,
      fields,
    }: {
      name: string;
      description?: string;
      fields: (self: Interface<Ctx, Src | null>) => Array<AbstractField<Ctx, any>>;
    }): Interface<Ctx, Src | null> {
      const obj: Interface<Ctx, Src | null> = {
        kind: 'Interface',
        name,
        description,
        fieldsFn: undefined as any,
      };

      obj.fieldsFn = () => fields(obj) as any;
      return obj;
    },
    List<Src>(ofType: OutputType<Ctx, Src>): OutputType<Ctx, Array<Src> | null> {
      return {
        kind: 'List',
        ofType: ofType as any,
      };
    },
    ListInput<Src>(ofType: InputType<Src>): InputType<Array<Src> | null> {
      return {
        kind: 'ListInput',
        ofType: ofType as any,
      };
    },
    NonNull<Src>(ofType: OutputType<Ctx, Src | null>): OutputType<Ctx, Src> {
      return {
        kind: 'NonNull',
        ofType: ofType as any,
      };
    },

    NonNullInput<Src>(ofType: InputType<Src | null>): InputType<Src> {
      return {
        kind: 'NonNullInput',
        ofType: ofType as any,
      };
    },
    queryType<RootSrc>({
      name = 'Query',
      fields,
    }: {
      name?: string;
      fields: Array<Field<Ctx, RootSrc, any>>;
    }): ObjectType<Ctx, RootSrc> {
      return {
        kind: 'ObjectType',
        name,
        interfaces: [],
        fieldsFn: () => fields,
      };
    },
    mutationType<RootSrc>({
      name = 'Mutation',
      fields,
    }: {
      name?: string;
      fields: () => Array<Field<Ctx, RootSrc, any>>;
    }): ObjectType<Ctx, RootSrc> {
      return {
        kind: 'ObjectType',
        name,
        interfaces: [],
        fieldsFn: fields,
      };
    },
    subscriptionField<RootSrc, Out, Arg>(
      name: string,
      {
        type,
        args = {} as ArgMap<Arg>,
        subscribe,
        resolve,
        description,
        deprecationReason,
      }: {
        type: OutputType<Ctx, Out>;
        args?: ArgMap<Arg>;
        description?: string;
        deprecationReason?: string;
        subscribe: (
          src: RootSrc,
          args: TOfArgMap<ArgMap<Arg>>,
          ctx: Ctx,
          info: graphql.GraphQLResolveInfo
        ) => AsyncIterator<Out> | Promise<AsyncIterator<Out>>;
        resolve?: (
          src: RootSrc,
          args: TOfArgMap<ArgMap<Arg>>,
          ctx: Ctx,
          info: graphql.GraphQLResolveInfo
        ) => Out | Promise<Out>;
      }
    ): SubscriptionField<Ctx, RootSrc, Arg, Out> {
      return {
        kind: 'SubscriptionField',
        name,
        type,
        args,
        subscribe,
        resolve,
        description,
        deprecationReason,
      };
    },
    subscriptionType<Src>({
      name = 'Subscription',
      fields,
    }: {
      name?: string;
      fields: Array<SubscriptionField<Ctx, Src, unknown, unknown>>;
    }): SubscriptionObject<Ctx, Src> {
      return {
        kind: 'SubscriptionObject',
        name,
        fields,
      };
    },
  };
}
