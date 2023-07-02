# ts-versions-switcher README

A simple extension to switch typescript versions

## Features

Detects typescript versions installed in node_modules.
provides a command "Switch TS Version" to let you choose between them

## Usage

run the "Switch TS Version" command once  
set your tsdk to ~/.vscode-server/extensions/typeholes.ts-versions-switcher-0.0.2/typescript/lib  
select that as the typescript version  
from then on the "Switch TS Version" command will restart the TS server under the selected version

## Installing multiple typescript versions

Use the package alias feature, for example add the following lines to your dev dependencies in package.json

```
        "typescript493": "npm:typescript@4.9.3",
        "typescript503": "npm:typescript@5.0.3"
```

then npm/pnpm/yarn/whatever install
