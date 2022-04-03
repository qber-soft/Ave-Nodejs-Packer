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
  await rcedit(cacheExe, rceditOptions);
  editSubsystem(cacheExe);

  //
  if (cacheExe.includes("fetched")) {
    const renamed = cacheExe.replace("fetched", "built");
    fs.renameSync(cacheExe, renamed);
  }

  //
  const pkg = await import("pkg");
  await pkg.exec([
    input,
    ...["--target", pkgTarget],
    ...["--output", outputExe],
  ]);
}

async function downloadCache(pkgTarget: string): Promise<string> {
  const [nodeRange, platform, arch] = pkgTarget.split("-");
  const pkgFetch = await import("pkg-fetch");
  const cacheName = await pkgFetch.need({ nodeRange, platform, arch });
  return cacheName;
}

function editSubsystem(exePath: string) {
  const editor = path.resolve(__dirname, "../lib/editbin/editbin.exe");
  const args = ["/subsystem:windows", exePath].join(" ");
  const command = `"${editor}" ${args}`;
  childProcess.execSync(command);
}
