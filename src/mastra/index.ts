import { Mastra } from "@mastra/core";
import { expenseWorkflow } from "./workflows/expense-workflow";
import { PostgresStore } from "@mastra/pg";

const storage = new PostgresStore({
  host: process.env.POSTGRES_HOST!,
  port: Number(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DATABASE!,
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
});

export const mastra = new Mastra({
  storage,
  workflows: {
    expenseWorkflow,
  },
});
