## Get files changed in Github Pull Request

This action is used to collect updated files for a specific PR. The list of 
updated files then used to build Github matrix object and run additional
workflows, eg. yaml validation.

### Inputs
| Input parameter | Description | Required | Default |
| --------------- | ----------- | ---------| ------- |
| token  | GitHub token for GitHub API requests. | `true` | ${{ github.token }} |
| repository | Github repository | `true` | ${{ github.event.repository.name }} |
| owner | Github repository owner | `false` | None |
| pr-number | Pull request number | `true` | ${{ github.event.number }} |
| per-page | Number of items per page in API call | `true` | '100' |
| result-encoding | Either "string" or "json" how the result will be encoded. | None | json |

### Outputs
| Output parameter | Description |
| ---------------- | ----------- | 
| files | The list of files changed in a pull request. |
| sha | Most recent commit SHA in a pull request. |
| msg | Most recent commit message in a pull request. |


## Code the changes
> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Then install the dependencies: 
```bash
$ npm install
```

All code for the action itself is in [src/main.ts](src/main.ts) file and written in Typescript.
Typescrip code cannot be directly executed by node and must be "transpiled" into vanilla JS first.

To build the typescript and package it for distribution:
```bash
$ npm run build && npm run package
```

or just:
```bash
$ npm run all
```

## Change action.yml

The `action.yml` defines the inputs and output for your action.

Update the action.yml with description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

## Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
```
The test action in this repo will fail if you forgot to build the package with `npm run all`, so make sure you did it.

## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action

