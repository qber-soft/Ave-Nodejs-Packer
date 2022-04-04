#!/usr/bin/env node

import { program } from "commander";
import { withConfig } from "./cosmiconfig";
import { pack } from "./pack";
export { IPackConfig } from "./pack";

program
  .command("pack")
  .description("pack ave app")
  .action(() => {
    withConfig((config) => {
      try {
        pack(config);
      } catch (error) {
        console.error(error);
      }
    });
  });

program.parse();
