import { Mastra } from "@mastra/core";
import { expenseWorkflow } from "./workflows/expense-workflow";

export const mastra = new Mastra({
  vnext_workflows: {
    expenseWorkflow,
  },
});
