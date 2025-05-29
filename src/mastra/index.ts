import { Mastra } from "@mastra/core";
import { expenseWorkflow } from "./workflows/expense-workflow";
import { PostgresStore } from "@mastra/pg";

import { dbConfig } from '@/lib/db';

const storage = new PostgresStore(dbConfig);

export const mastra = new Mastra({
  storage,
  workflows: {
    expenseWorkflow,
  },
});
