# Backend Connection Safety & Resource Lifecycle Rule

To prevent connection leaks, socket starvation, and zombie database connections in backend services:

## Guidelines
1. **Zero Open/Leaked Connections**: Never leave a database pool, client connection, redis connection, file stream, or network socket open or dangling.
2. **Always Use Connection Pools**: Reread from shared connection pools (`dbPool` in `src/queries/dbPool.ts`). Do not instantiate standalone single `Client` instances without explicitly closing them in a `finally` block.
3. **Always Release Checkout Clients**: When checking out a dedicated pool client (`const client = await dbPool.connect()`), ALWAYS wrap operations in `try ... finally` and call `client.release()` in the `finally` block.
4. **Graceful Shutdown**: On process signals (`SIGTERM`, `SIGINT`, unhandled exceptions), ensure all connection pools are closed cleanly via `closeDbPool()`.
5. **Configured Timeouts**: Database pools must enforce `idleTimeoutMillis` and `connectionTimeoutMillis` to automatically reap dead or idle connections.
