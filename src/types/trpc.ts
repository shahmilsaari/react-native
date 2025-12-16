import { initTRPC } from '@trpc/server';

export type AuthLoginInput = {
  email: string;
  password: string;
};

export type AuthLoginOutput = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    companyId?: string;
  };
};

// Generic types for placeholders
type IDInput = { id: string };
type SuccessOutput = { success: boolean };

/**
 * Placeholder for Zod-like input inference without strictly requiring Zod at runtime
 * if it's not available in dependencies.
 */
const input = <T>() => (val: unknown) => val as T;

const t = initTRPC.create();

/**
 * Manual definition of AppRouter to match Backend
 * Updated manually based on venso-be source
 */
export const appRouter = t.router({
  // Auth Router
  auth: t.router({
    login: t.procedure.input(input<AuthLoginInput>()).output(input<AuthLoginOutput>()).mutation(async () => ({} as AuthLoginOutput)),
    register: t.procedure.input(input<any>()).output(input<SuccessOutput>()).mutation(async () => ({} as SuccessOutput)),
    refreshToken: t.procedure.input(input<{ refreshToken: string }>()).output(input<AuthLoginOutput>()).mutation(async () => ({} as AuthLoginOutput)),
    logout: t.procedure.output(input<SuccessOutput>()).mutation(async () => ({} as SuccessOutput)),
    me: t.procedure.output(input<AuthLoginOutput['user']>()).query(async () => ({} as AuthLoginOutput['user'])),
  }),

  // Users Router
  users: t.router({
    getById: t.procedure.input(input<IDInput>()).query(async () => ({} as any)),
    update: t.procedure.input(input<IDInput & Record<string, any>>()).mutation(async () => ({} as any)),
    delete: t.procedure.input(input<IDInput>()).mutation(async () => ({} as SuccessOutput)),
  }),

  // Services Router
  services: t.router({
    my: t.procedure.query(async () => ({} as any[])),
    getServices: t.procedure.query(async () => ({} as any[])),
    getById: t.procedure.input(input<IDInput>()).query(async () => ({} as any)),
    availabilityCalendar: t.procedure.input(input<any>()).mutation(async () => ({} as { date: string; available: boolean; windows: { startAt: string; endAt: string }[] }[])),
    create: t.procedure.input(input<any>()).mutation(async () => ({} as any)),
    update: t.procedure.input(input<IDInput & any>()).mutation(async () => ({} as any)),
    delete: t.procedure.input(input<IDInput>()).mutation(async () => ({} as SuccessOutput)),
  }),

  // Bookings Router
  bookings: t.router({
    my: t.procedure.query(async () => ({} as any[])),
    create: t.procedure.input(input<any>()).mutation(async () => ({} as any)),
    update: t.procedure.input(input<IDInput & any>()).mutation(async () => ({} as any)),
    delete: t.procedure.input(input<IDInput>()).mutation(async () => ({} as SuccessOutput)),
  }),

  // Placeholders for other routers found in backend
  // Define these as empty routers or generic procedures as needed
  entities: t.router({}),
  roles: t.router({}),
  companies: t.router({}),
  companySsm: t.router({}),
  events: t.router({
    my: t.procedure.query(async () => ({} as any[])),
    create: t.procedure.input(input<any>()).mutation(async () => ({} as any)),
    update: t.procedure.input(input<IDInput & any>()).mutation(async () => ({} as any)),
    delete: t.procedure.input(input<IDInput>()).mutation(async () => ({} as SuccessOutput)),
  }),

  plannings: t.router({}),
  accessModules: t.router({}),
  permissions: t.router({}),
  categories: t.router({}),
  locations: t.router({}),
});

export type AppRouter = typeof appRouter;
