// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as fs from 'fs';
import path = require('path');

import { exec as _exec } from 'child_process';
import { promisify } from 'util';
import { everyTsswitchTo } from './everyTs';

const exec = promisify(require('node:child_process').exec);

let tsVersions: string[] = [];

async function installTsVersion(storagePath: string, version: string) {
  try {
    const { stdout, _stderr } = await exec(
      `npm install '${version}@npm:typescript@${version}'`,
      { cwd: storagePath },
    );
    tsVersions.push(version);
    vscode.window.showInformationMessage(stdout);
  } catch (e) {
    vscode.window.showErrorMessage(
      typeof e === 'object' && e && 'message' in e
        ? (e.message as string)
        : `${e}`,
    );
  }
}
//npm i kool@npm:case
async function getTsVersions(storagePath: string) {
  try {
    const { stdout, _stderr } = await exec(
      "npm show 'typescript@*' versions --json",
      { cwd: storagePath },
    );
    tsVersions = JSON.parse(stdout).reverse();
  } catch (e) {
    vscode.window.showErrorMessage(
      typeof e === 'object' && e && 'message' in e
        ? (e.message as string)
        : `${e}`,
    );
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  const storagePath = context.globalStorageUri.fsPath;

  fs.mkdirSync(path.join(storagePath, 'node_modules'), { recursive: true });

  vscode.commands.registerCommand(
    'ts-versions-switch.every-ts-switch',
    everyTsswitchTo,
  );

  vscode.commands.registerCommand('ts-versions-switch.open-terminal', () => {
    vscode.window.createTerminal({ cwd: storagePath });
  });

  vscode.commands.registerCommand(
    'ts-versions-switch.set-global-version',
    () => {
      vscode.workspace
        .getConfiguration()
        .update(
          'typescript.tsdk',
          path.join(storagePath, 'typescript', 'lib'),
          vscode.ConfigurationTarget.Global,
        );
    },
  );

  vscode.commands.registerCommand(
    'ts-versions-switch.set-workspace-version',
    () => {
      vscode.workspace
        .getConfiguration()
        .update(
          'typescript.tsdk',
          path.join(storagePath, 'typescript', 'lib'),
          vscode.ConfigurationTarget.Workspace,
        );
    },
  );

  let disposable = vscode.commands.registerCommand(
    'ts-versions-switcher.switch',
    async () => {
      const files = fs.readdirSync(path.join(storagePath, 'node_modules'));
      const dirs = files.filter(
        (dir) =>
          fs
            .statSync(path.join(storagePath, 'node_modules', dir), {
              throwIfNoEntry: false,
            })
            ?.isDirectory(),
      );
      const binDirs = dirs.filter(
        (dir) =>
          fs
            .statSync(path.join(storagePath, 'node_modules', dir, 'bin'), {
              throwIfNoEntry: false,
            })
            ?.isDirectory(),
      );
      const installed = binDirs.filter(
        (dir) =>
          fs
            .statSync(
              path.join(storagePath, 'node_modules', dir, 'bin', 'tsserver'),
              {
                throwIfNoEntry: false,
              },
            )
            ?.isFile(),
      );

      await getTsVersions(storagePath);
      const latestDev = installed.includes(tsVersions[0])
        ? tsVersions[0]
        : 'Install: ' + tsVersions[0];
      const versions = tsVersions
        .filter((v) => !installed.includes(v) && !v.match(/dev/))
        .slice(0, 50)
        .map((v) => `Install: ${v}`);

      versions.unshift('every-ts.current');

      vscode.window
        .showQuickPick([latestDev, ...installed, ...versions])
        .then(async (option) => {
          if (option) {
            if (option === 'every-ts.current') {
              vscode.commands.executeCommand('typescript.restartTsServer');
            }

            if (option.startsWith('Install:')) {
              option = option.slice(9);
              await installTsVersion(storagePath, option);
              // todo
            }
            const toPath = path.join(storagePath, 'node_modules', option);
            const fromPath = path.join(storagePath, 'typescript');

            if (fs.statSync(fromPath, { throwIfNoEntry: false })) {
              fs.unlinkSync(fromPath);
            }

            vscode.window.showInformationMessage(`selected: ${option}`);
            fs.symlink(toPath, fromPath, 'dir', (err) => {
              if (err) vscode.window.showErrorMessage(err.message);
              else {
                console.log('Symlink created');
                console.log(
                  'Symlink is a directory:',
                  fs.statSync(toPath, { throwIfNoEntry: false })?.isDirectory(),
                );

                vscode.commands.executeCommand('typescript.restartTsServer');
              }
            });
          }
        });
    },
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
