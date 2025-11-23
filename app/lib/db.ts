import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

let pool: Pool | null = null;

export function getPool(cfg: string | PoolOptions): Pool {
  if (!pool) {
    pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);
  }
  return pool;
}
