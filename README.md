# TypeScript Styled Plugin

TypeScript server plugin that adds intellisense to styled component css strings

![](documentation/preview.gif)

[![Build Status](https://travis-ci.org/Microsoft/typescript-styled-plugin.svg?branch=master)](https://travis-ci.org/Microsoft/typescript-styled-plugin)

## Usage
This plugin requires TypeScript 2.4 or later. It can provide intellisense in both JavaScript and TypeScript files within any editor that uses TypeScript to power their language features. This includes [VS Code](https://code.visualstudio.com), [Visual Studio](https://www.visualstudio.com), [Sublime with the TypeScript plugin](https://github.com/Microsoft/TypeScript-Sublime-Plugin), [Atom with the TypeScript plugin](https://atom.io/packages/atom-typescript), and others. 

To get started, install the plugin in your workspace:

```bash
npm install --save-dev typescript-styled-plugin
```

Then add a `plugins` section to your [`tsconfig.json`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) or [`jsconfig.json`](https://code.visualstudio.com/Docs/languages/javascript#_javascript-project-jsconfigjson)

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-styled-plugin"
      }
    ]
  }
}
```

> **❗️Important**: With VS Code, TypeScript plugins require that you use a [workspace version of TypeScript](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions). To do this, first install TypeScript in your workspace by running `npm install typescript` and then run the `Select TypeScript version` command in VS Code to switch to this version for JavaScript and TypeScript language support.
>
> You can find more information about managing typescript versions [in the VS Code documentation](https://code.visualstudio.com/Docs/languages/typescript#_using-newer-typescript-versions)


### Configuration

To disable error reporting, set `"validate": false` in the plugin configuration:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-styled-plugin",
        "validate": false
      }
    ]
  }
}
```

You can also configure how errors are reported using linter settings. 

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "typescript-styled-plugin",
        "lint": {
          "vendorPrefix": "error",
          "zeroUnits": "ignore"
        }
      }
    ]
  }
}
```

The following lint options are supported:

#### compatibleVendorPrefixes
```
"ignore" | "warning" | "error"
```

When using a vendor-specific prefix make sure to also include all other vendor-specific properties. Default is `"ignore"`.

#### vendorPrefix
```
"ignore" | "warning" | "error"
```

When using a vendor-specific prefix also include the standard property. Default is `"warning"`.

#### duplicateProperties
```
"ignore" | "warning" | "error"
```

Do not use duplicate style definitions. Default is `"ignore"`.

#### emptyRules
```
"ignore" | "warning" | "error"
```

Do not use empty rulesets. Default is `"warning"`.

#### importStatement
```
"ignore" | "warning" | "error"
```

Import statements do not load in parallel. Default is `"ignore"`.

#### boxModel
```
"ignore" | "warning" | "error"
```

Do not use width or height when using padding or border.  Default is `"ignore"`.

#### universalSelector
```
"ignore" | "warning" | "error"
```

The universal selector (*) is known to be slow. Default is `"ignore"`.

#### zeroUnits
```
"ignore" | "warning" | "error"
```

No unit for zero needed. Default is `"ignore"`.

#### fontFaceProperties
```
"ignore" | "warning" | "error"
```
@font-face rule must define 'src' and 'font-family' properties. Default is `"warning"`.

#### hexColorLength
```
"ignore" | "warning" | "error"
```

Hex colors must consist of three or six hex numbers. Default is `"error"`.

#### argumentsInColorFunction
```
"ignore" | "warning" | "error"
```

Invalid number of parameters. Default is `"error"`.

#### unknownProperties
```
"ignore" | "warning" | "error"
```

Unknown property. Default is `"warning"`.

#### ieHack
```
"ignore" | "warning" | "error"
```
IE hacks are only necessary when supporting IE7 and older. Default is `"ignore"`.

#### unknownVendorSpecificProperties
```
"ignore" | "warning" | "error"
```
Unknown vendor specific property. Default is `"ignore"`.

#### propertyIgnoredDueToDisplay
```
"ignore" | "warning" | "error"
```

Property is ignored due to the display. E.g. with 'display: inline', the width, height, margin-top, margin-bottom, and float properties have no effect. Default is `"warning"`

#### important
```
"ignore" | "warning" | "error"
```

Avoid using !important. It is an indication that the specificity of the entire CSS has gotten out of control and needs to be refactored. Default is `"ignore"`.

#### float
```
"ignore" | "warning" | "error"
```

Avoid using 'float'. Floats lead to fragile CSS that is easy to break if one aspect of the layout changes. Default is `"ignore"`.

#### idSelector
```
"ignore" | "warning" | "error"
```

Selectors should not contain IDs because these rules are too tightly coupled with the HTML. Default is `"ignore"`.


## Contributing

To build the typescript-styled-plugin, you'll need [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/).

First, [fork](https://help.github.com/articles/fork-a-repo/) the typescript-styled-plugin repo and clone your fork:

```bash
git clone https://github.com/YOUR_GITHUB_ACCOUNT_NAME/typescript-styled-plugin.git
cd typescript-styled-plugin
```

Then install dev dependencies:

```bash
npm install
```

The plugin is written in [TypeScript](http://www.typescriptlang.org). The source code is in the `src/` directory with the compiled JavaScript output to the `lib/` directory. Kick off a build using the `compile` script:

```bash
npm run compile
```

And then run the end to end tests with the `e2e` script:

```bash
npm run e2e
```

You can submit bug fixes and features through [pull requests](https://help.github.com/articles/about-pull-requests/). To get started, first checkout a new feature branch on your local repo:

```bash
git checkout -b my-awesome-new-feature-branch
```

Make the desired code changes, commit them, and then push the changes up to your forked repository:

```bash
git push origin my-awesome-new-feature-branch
```

Then [submit a pull request](https://help.github.com/articles/creating-a-pull-request/
) against the Microsoft typescript-styled-plugin repository.

Please also see our [Code of Conduct](CODE_OF_CONDUCT.md).


## Credits

Code originally forked from: https://github.com/Quramy/ts-graphql-plugin