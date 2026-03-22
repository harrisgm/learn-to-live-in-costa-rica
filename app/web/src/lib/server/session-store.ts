import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import type { SessionStore } from "@/lib/data/contracts";
import type { PracticeSession } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __crcMemorySessions: Map<string, PracticeSession[]> | undefined;
  // eslint-disable-next-line no-var
  var __crcPgPool: Pool | undefined;
}

class MemorySessionStore implements SessionStore {
  private readonly sessions =
    globalThis.__crcMemorySessions ?? new Map<string, PracticeSession[]>();

  constructor() {
    globalThis.__crcMemorySessions = this.sessions;
  }

  async listSessions(learnerId: string) {
    return this.sessions.get(learnerId) ?? [];
  }

  async saveSession(session: PracticeSession) {
    const existing = this.sessions.get(session.learnerId) ?? [];
    const updated = [session, ...existing].slice(0, 50);
    this.sessions.set(session.learnerId, updated);
    return session;
  }
}

class PostgresSessionStore implements SessionStore {
  private readonly pool: Pool;
  private schemaReady: Promise<void> | null = null;

  constructor() {
    this.pool =
      globalThis.__crcPgPool ??
      new Pool({
        connectionString: process.env.DATABASE_URL
      });

    globalThis.__crcPgPool = this.pool;
  }

  private async ensureSchema() {
    if (!this.schemaReady) {
      this.schemaReady = this.pool
        .query(`
          create table if not exists coaching_sessions (
            id text primary key,
            learner_id text not null,
            created_at timestamptz not null,
            mode text not null,
            difficulty text not null,
            scenario_id text not null,
            source text not null,
            user_input text not null,
            feedback jsonb not null
          );
        `)
        .then(() => undefined);
    }

    await this.schemaReady;
  }

  async listSessions(learnerId: string) {
    await this.ensureSchema();

    const result = await this.pool.query(
      `
        select
          id,
          learner_id,
          created_at,
          mode,
          difficulty,
          scenario_id,
          source,
          user_input,
          feedback
        from coaching_sessions
        where learner_id = $1
        order by created_at desc
        limit 50
      `,
      [learnerId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      learnerId: row.learner_id,
      createdAt: new Date(row.created_at).toISOString(),
      mode: row.mode,
      difficulty: row.difficulty,
      scenarioId: row.scenario_id,
      source: row.source,
      userInput: row.user_input,
      feedback: row.feedback
    })) as PracticeSession[];
  }

  async saveSession(session: PracticeSession) {
    await this.ensureSchema();

    await this.pool.query(
      `
        insert into coaching_sessions (
          id,
          learner_id,
          created_at,
          mode,
          difficulty,
          scenario_id,
          source,
          user_input,
          feedback
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      `,
      [
        session.id,
        session.learnerId,
        session.createdAt,
        session.mode,
        session.difficulty,
        session.scenarioId,
        session.source,
        session.userInput,
        JSON.stringify(session.feedback)
      ]
    );

    return session;
  }
}

let store: SessionStore | null = null;

export function getSessionStore() {
  if (!store) {
    store = process.env.DATABASE_URL
      ? new PostgresSessionStore()
      : new MemorySessionStore();
  }

  return store;
}

export function createSession(input: Omit<PracticeSession, "id" | "createdAt">): PracticeSession {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input
  };
}
