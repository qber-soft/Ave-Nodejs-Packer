import * as rcedit from "rcedit";
import * as path from "path";
import * as fs from "fs";
import * as childProcess from "child_process";

export interface IPackConfig {
  build: {
    projectRoot: string;
    target: string;
    input: string;
    output: string;
    debug?: boolean;
    edit?: boolean
  };
  resource?: {
    icon?: string;
    productVersion?: string;
    fileVersion?: string;
    companyName?: string;
    fileDescription?: string;
    productName?: string;
    LegalCopyright?: string;
  };
}

// ref: https://github.com/vercel/pkg/issues/212
export async function pack(packConfig: IPackConfig) {
  const { build: buildConfig, resource: resourceConfig = {} } = packConfig;
  const {
    target: pkgTarget,
    output: outputExe,
    input,
    projectRoot,
    debug = false,
    edit = true
  } = buildConfig;
  const {
    icon,
    productVersion = "",
    fileVersion = "",
    companyName = "",
    fileDescription = "",
    productName = "",
    LegalCopyright = "",
  } = resourceConfig;
  process.env.PKG_CACHE_PATH = path.resolve(projectRoot, "./.pkg-cache");

  const cacheExe = await downloadCache(pkgTarget);
  console.log(`pack use ${cacheExe}`);

  //
  const rceditOptions: rcedit.Options = {
    "product-version": productVersion,
    "file-version": fileVersion,
    "version-string": {
      CompanyName: companyName,
      FileDescription: fileDescription,
      ProductName: productName,
      LegalCopyright: LegalCopyright,
    },
  };
  if (icon) {
    rceditOptions.icon = icon;
  }

  //
  if(edit) {
    await rcedit(cacheExe, rceditOptions);
    editSubsystem(cacheExe, debug);
  }


  //
  if (cacheExe.includes("fetched")) {
    const renamed = cacheExe.replace("fetched", "built");
    fs.renameSync(cacheExe, renamed);
  }

  removeNodeAddonBackup(projectRoot);

  //
  const pkg = await import("pkg");
  const args = [
    input,
    ...["--target", pkgTarget],
    ...["--output", outputExe],
  ];
  
  if(debug) {
    args.push("--debug");
  }

  const configPath =  path.resolve(
    projectRoot,
    "./pkg.config.json"
  );
  if(fs.existsSync(configPath)) {
    args.push(...["--config", "pkg.config.json"])
  }
  await pkg.exec(args);
}

function removeNodeAddonBackup(projectRoot: string) {
  const backupPath = path.resolve(
    projectRoot,
    "./node_modules/ave-ui/lib/Avernakis-Nodejs.node.bak"
  );
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath);
  }
}

async function downloadCache(pkgTarget: string): Promise<string> {
  const [nodeRange, platform, arch] = pkgTarget.split("-");
  const pkgFetch = await import("pkg-fetch");
  const cacheName = await pkgFetch.need({ nodeRange, platform, arch });
  return cacheName;
}

function editSubsystem(exePath: string, debug = false) {
  const editor = path.resolve(__dirname, "../lib/editbin/editbin.exe");
  const args = [debug ? "/subsystem:console" : "/subsystem:windows", `"${exePath}"`].join(" ");
  const command = `"${editor}" ${args}`;
  childProcess.execSync(command);
}
