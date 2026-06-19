/// <reference types="node" />
import process from "process";
import { processRecurringTasks } from "./src/services/recurringTasks.js";

console.log("Triggering recurring tasks for today...");

processRecurringTasks()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
