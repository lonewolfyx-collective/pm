# create: Create a Project from a Template

`create` asks you to choose a template and target directory, then downloads the template files.

## Usage

```bash
create
create --cwd ./apps
```

The command fetches template definitions from the `templates` directory in `lonewolfyx-template/starter`, so network access is required. Available templates depend on the fetched definitions.

## Execution

1. Fetch the template list and display template names and descriptions.
2. Ask for a target directory, defaulting to the selected template's `defaultDir`.
3. Resolve the target relative to the working directory and download the template.

For example, running `create --cwd ./apps` and entering `web` creates the project in `./apps/web`. Cancelling either prompt exits with a non-zero status.

::: danger Existing target directory contents are deleted
If the target already exists, the command deletes everything in it except `.git` before downloading the template, without an overwrite confirmation. Choosing `.` clears the working directory. Choose a new directory or back up the target first.
:::

## Comparison with init

| Behavior | `create` | `init <name>` |
| --- | --- | --- |
| Interactive template and directory selection | Supported | Supported |
| Default target directory | The template's `defaultDir` | The positional `<name>` |
| Project description prompt | Not provided | Provided |
| `pkg-placeholder` and `_description_` | Preserved as downloaded | Replaced in `package.json` and `README.md` |
| Git initialization | Not provided | Available with `--git` |
| Automatic dependency installation | Not performed | Not performed |

`create` declares only the shared `-c, --cwd <dir>` option; enter the target directory at the prompt. Use [`init <name>`](./init#create-a-project-from-a-template) for description entry and placeholder replacement. After generation, enter the target directory and install dependencies as required by the template.
