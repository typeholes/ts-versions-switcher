import { spawn } from 'child_process';
import { ProgressLocation, window, commands } from 'vscode';

function isInstalled() {}

export async function everyTsswitchTo() {
  const to = await window.showInputBox();
  if (!to || to.includes("'")) return;

  window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: 'every-ts switch',
      cancellable: true,
    },
    (progress, token) => {
      return new Promise((resolve) => {
        let output = '';

        const subprocess = spawn(`every-ts switch '${to}'`, {
          stdio: 'pipe',
          shell: true,
        });
        // const subprocess = spawn(`yes`, { stdio: 'pipe', shell: true });

        token.onCancellationRequested(subprocess.kill);

        subprocess.stderr.on('data', (data) => {
          const message = data.toString('utf8');
          output += '\n' + message;
          progress.report({ message });
        });
        subprocess.stdout.on('data', (data) => {
          const message = data.toString('utf8');
          output += '\n' + message;
          progress.report({ message });
        });
        subprocess.on('close', (code, signal) => {
          window.showInformationMessage(
            `everyTs switch finished ${code} ${signal}\n${output}`,
          );
          commands.executeCommand('typescript.restartTsServer');
          resolve('done');
        });
      });
    },
  );
}
