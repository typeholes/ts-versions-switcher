// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as fs from 'fs';
import path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "ts-versions-switcher" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'ts-versions-switcher.switch',
    () => {


      const extPath = vscode.extensions.getExtension(
        'typeholes.ts-versions-switcher'
      )?.extensionUri.fsPath;

      if (!extPath) {
        vscode.window.showErrorMessage('extension path not found');
        return;
      }

      const projectPath =
        (vscode.workspace.workspaceFolders ?? [])[0]?.uri?.fsPath ?? __dirname;

      const files = fs.readdirSync(path.join(projectPath, 'node_modules'));
      const dirs = files.filter((dir) =>
        fs
          .statSync(path.join(projectPath, 'node_modules', dir), {
            throwIfNoEntry: false,
          })
          ?.isDirectory()
      );
      const binDirs = dirs.filter((dir) =>
        fs
          .statSync(path.join(projectPath, 'node_modules', dir, 'bin'), {
            throwIfNoEntry: false,
          })
          ?.isDirectory()
      );
      const tsDirs = binDirs.filter((dir) =>
        fs
          .statSync(
            path.join(projectPath, 'node_modules', dir, 'bin', 'tsserver'),
            {
              throwIfNoEntry: false,
            }
          )
          ?.isFile()
      );

      vscode.window.showQuickPick(tsDirs).then((option) => {
        if (option) {
          const toPath = path.join(projectPath, 'node_modules', option);
          const fromPath = path.join(extPath, 'typescript');

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
                fs
                  .statSync('symlinkToDir', { throwIfNoEntry: false })
                  ?.isDirectory()
              );

              vscode.commands.executeCommand('typescript.restartTsServer');
            }
          });
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
