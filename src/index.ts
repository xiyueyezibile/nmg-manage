import { program } from "commander";
import pkg from "../package.json";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const saveFilePath = path.join(__dirname, "data.json");
const saveRepoPath = path.join(__dirname, "repo-data.json");
const configPath = path.join(__dirname, "config.json");

program.version(pkg.version);
program.description(pkg.description);
program.name(pkg.name);
program.usage("<command> [options]");

async function hasDiffTag(tag: string, savePath: string) {
  const isExistSaveFile = await fs.exists(savePath);
  if (isExistSaveFile) {
    const data = await fs.readFile(savePath);
    const saveLists = JSON.parse(data.toString());
    for (const item of saveLists) {
      if (item.name === tag) {
        return false;
      }
    }
  }
  return true;
}

async function addJSONData(tag: string, address: string, filePath: string) {
  const isExistSaveFile = await fs.exists(filePath);
  if (isExistSaveFile) {
    const data = await fs.readFile(filePath);
    const saveLists = JSON.parse(data.toString());
    saveLists.push({
      name: tag,
      target: address,
    });

    await fs.writeFile(filePath, `${JSON.stringify(saveLists)}`);
  } else {
    await fs.ensureFile(filePath);
    const list = [
      {
        name: tag,
        target: address,
      },
    ];
    await fs.writeFile(filePath, `${JSON.stringify(list)}`);
  }
}

program
  .command("add <tag> [npm-address]")
  .option("-r")
  .description("Add a new npm address to the list")
  .action(async (tag, npmAddress, options) => {
    if (options.r && (await hasDiffTag(tag, saveRepoPath))) {
      await addJSONData(
        tag,
        npmAddress || path.join(process.cwd()),
        saveRepoPath
      );
    } else if (!options.r && (await hasDiffTag(tag, saveFilePath))) {
      if (!npmAddress) {
        console.log(chalk.red("npm address is required"));
        return;
      }
      await addJSONData(tag, npmAddress, saveFilePath);
    }
    console.log(chalk.green("Add success"));
  });
program
  .command("ls")
  .option("-r", "List all repo")
  .description("List all npm address")
  .action(async (options) => {
    if (options.r) {
      const isExistSaveFile = await fs.exists(saveRepoPath);
      if (isExistSaveFile) {
        console.log(chalk.green("repo list: "));
        const data = await fs.readFile(saveRepoPath);
        const saveLists = JSON.parse(data.toString());
        for (const item of saveLists) {
          console.log(`${chalk.green(item.name)}(${item.target})`);
        }
      } else {
        console.log(chalk.red("No repo found"));
      }
    } else {
      const isExistSaveFile = await fs.exists(saveFilePath);
      if (isExistSaveFile) {
        console.log(chalk.green("npm list: "));
        const data = await fs.readFile(saveFilePath);
        const saveLists = JSON.parse(data.toString());

        for (const item of saveLists) {
          console.log(`${chalk.green(item.name)}(${item.target})`);
        }

        //   const saveLists = JSON.parse(data);
        //   console.log(saveLists);
      } else {
        console.log(chalk.red("No lists found"));
      }
    }
  });
program
  .command("clean")
  .option("-r")
  .description("Clean all npm address")
  .action(async (options) => {
    if (options.r) {
      await fs.unlink(saveRepoPath);
    } else {
      await fs.unlink(saveFilePath);
    }
    console.log(chalk.green("Clean All success"));
  });
program
  .command("cur")
  .description("current npm address")
  .action(async () => {
    const isExistConfigPath = await fs.exists(configPath);
    if (!isExistConfigPath) {
      exec("npm config get registry", (err, stdout) => {
        if (err) {
          console.log(chalk.red(err));
        } else {
          console.log(`current address: ${chalk.green(stdout)}`);
        }
      });
    } else {
      const data = await fs.readFile(configPath);
      const config = JSON.parse(data.toString());
      console.log(
        `current address: ${chalk.green(config.name)}(${config.address})`
      );
    }
  });
program
  .command("use <tag>")
  .description("use npm address")
  .action(async (tag) => {
    const isExistConfigPath = await fs.exists(configPath);
    const isExistSaveFile = await fs.exists(saveFilePath);
    if (!isExistSaveFile) {
      console.log(
        chalk.red("list is empty, please use nmg add <tag> <address> first")
      );
      return;
    }
    const data = await fs.readFile(saveFilePath);
    const savaLists = JSON.parse(data.toString());

    if (!savaLists.filter((item: any) => item.name === tag).length) {
      console.log(
        chalk.red("tag is not found, please ensure you have added this tag")
      );
      return;
    }
    if (!isExistConfigPath) {
      await fs.writeFile(
        configPath,
        JSON.stringify({
          name: tag,
          address: savaLists.filter((item: any) => item.name === tag)[0].target,
        })
      );
    } else {
      const configData = await fs.readFile(configPath);
      const config = JSON.parse(configData.toString());
      config.name = tag;
      config.address = savaLists.filter(
        (item: any) => item.name === tag
      )[0].target;
      await fs.writeFile(configPath, JSON.stringify(config));
    }
    exec(
      `npm config set registry ${
        savaLists.filter((item: any) => item.name === tag)[0].target
      }`,
      (err, stderr) => {
        if (err) {
          console.log(chalk.red(err));
          return;
        }
        if (stderr) {
          console.log(chalk.red(stderr));
          return;
        }
        console.log(
          `current address: ${chalk.green(
            savaLists.filter((item: any) => item.name === tag)[0].target
          )}`
        );
      }
    );
  });
program
  .command("code <tag>")
  .option("-i [idea]")
  .description("open a repo")
  .action(async (tag: string, options: any) => {
    const isExistConfigPath = await fs.exists(configPath);
    if (!isExistConfigPath) {
      await fs.writeFile(
        configPath,
        JSON.stringify({ name: "", address: "", idea: options.i || "vscode" })
      );
    } else {
      const configData = await fs.readFile(configPath);
      const config = JSON.parse(configData.toString());
      config.idea = options.i || "vscode";
      await fs.writeFile(configPath, JSON.stringify(config));
    }

    const data = await fs.readFile(saveRepoPath);
    const savaLists = JSON.parse(data.toString());
    if (savaLists.filter((item: any) => item.name === tag).length === 0) {
      console.log(chalk.red("tag not found"));
      return;
    }
    if (options.i === "vscode") {
      exec(
        `code ${savaLists.filter((item: any) => item.name === tag)[0].target}`
      );
    } else {
      exec(
        `ws ${savaLists.filter((item: any) => item.name === tag)[0].target}`
      );
    }
  });
program.parse(process.argv);
