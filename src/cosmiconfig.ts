import { cosmiconfig } from "cosmiconfig";
import { default as tsLoader } from "@endemolshinegroup/cosmiconfig-typescript-loader";
import { IPackConfig } from "./pack";

const explorer = cosmiconfig("ave-pack", {
  searchPlaces: [`ave.config.ts`],
  loaders: {
    ".ts": tsLoader,
  },
});

export function withConfig(callback: (config: IPackConfig) => void) {
  explorer
    .search()
    .then((configInfo: { config: IPackConfig; filepath: string }) => {
      const { config, filepath } = configInfo;
      callback(config);
    });
}
