import { program } from "commander";
import pkg from "../package.json";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { exec } from "child_process";

const __dirname = path.resolve();
const saveFilePath = path.join(__dirname, "../data.json");

program.version(pkg.version);
program.description(pkg.description);
program.name(pkg.name);
program.usage("<command> [options]");
program
  .command("add <tag> <npm-address>")
  .description("Add a new npm address to the list")
  .action(async (tag, npmAddress) => {
    chalk.green("Add a new npm package to the list");
    const isExistSaveFile = await fs.exists(saveFilePath);
    if (isExistSaveFile) {
      const data = await fs.readFile(saveFilePath);
      const saveLists = JSON.parse(data.toString());
      saveLists.push({
        name: tag,
        target: npmAddress,
      });

      await fs.writeFile(saveFilePath, `${JSON.stringify(saveLists)}`);
    } else {
      await fs.ensureFile(saveFilePath);
      const list = [
        {
          name: tag,
          target: npmAddress,
        },
      ];
      await fs.writeFile(saveFilePath, `${JSON.stringify(list)}`);
    }
    console.log(chalk.green("Add success"));
  });
program
  .command("ls")
  .description("List all npm address")
  .action(async () => {
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
  });
program
  .command("clean [tag]")
  .description("Clean all npm address")
  .action(async (tag) => {
    await fs.unlink(saveFilePath);
    console.log(chalk.green("Clean All success"));
  });
program
  .command("cur")
  .description("current npm address")
  .action(async () => {
    const isExistConfigPath = await fs.exists(
      path.join(__dirname, "config.json")
    );
    if (!isExistConfigPath) {
      exec("npm config get registry", (err, stdout, stderr) => {
        if (err) {
          console.log(chalk.red(err));
        } else {
          console.log(`current address: ${chalk.green(stdout)}`);
        }
      });
    } else {
      const data = await fs.readFile(path.join(__dirname, "config.json"));
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
    const isExistConfigPath = await fs.exists(
      path.join(__dirname, "config.json")
    );
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
        path.join(__dirname, "config.json"),
        JSON.stringify({
          name: tag,
          address: savaLists.filter((item: any) => item.name === tag)[0].target,
        })
      );
    } else {
      const configData = await fs.readFile(path.join(__dirname, "config.json"));
      const config = JSON.parse(configData.toString());
      config.name = tag;
      config.address = savaLists.filter(
        (item: any) => item.name === tag
      )[0].target;
      await fs.writeFile(
        path.join(__dirname, "config.json"),
        JSON.stringify(config)
      );
    }
    exec(
      `npm config set registry ${
        savaLists.filter((item: any) => item.name === tag)[0].target
      }`,
      (err, stdout, stderr) => {
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
program.parse(process.argv);
