/// <reference lib="deno.worker" />
import { sleep } from "https://deno.land/x/sleep@v1.3.0/mod.ts";
import { usersTokensRepository } from "@modules/accounts/repositories/postgres/usersTokensRepository.ts"

interface WorkerMessage {
  type: string;
}

interface CleanupMessage extends WorkerMessage {
  type: "RUN_CLEANUP";
}

self.onmessage = async (event: MessageEvent<CleanupMessage>) => {
  const { type } = event.data;
  if (type === "RUN_CLEANUP") {
    try {
      await withRetry(attemptCleanup, 3); // Retry 3 times
      self.postMessage({ type: "CLEANUP_SUCCESS" });
    } catch (error) {
      self.postMessage({ type: "CLEANUP_FAILURE", error: error as Error });
    }
  }
};

async function attemptCleanup(): Promise<void> {
  await usersTokensRepository.deleteExpiredRefreshTokens();
}

async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(attempt * 4000);
    }
  }
  
  throw new Error("Unexpected error in withRetry function");
}
