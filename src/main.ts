import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'

async function run(): Promise<void> {
    try {
        // Get inputs
        const token = core.getInput('token', {required: true})
        const repo = core.getInput('repository', {required: true})
        const pr_number = core.getInput('pr-number', {required: true})
        const page = core.getInput('per-page', {required: true})

        let owner = core.getInput('owner')
        owner = owner ? owner : context.repo.owner

        let encoding = core.getInput('result-encoding')
        encoding = encoding ? encoding : 'json'

        // Create GitHub client with the token.
        const octokit = getOctokit(token)

        // Debug the inputs.
        core.info(`Repository: ${repo}`)
        core.info(`Owner: ${owner}`)
        core.info(`Pull request number: ${pr_number}`)
        core.info(`Per page: ${page}`)

        const pull_number: number = parseInt(pr_number)
        const per_page: number = parseInt(page)

        // a call to Github API to collect PR data
        const sha_resp = await octokit.rest.pulls.get({
            owner,
            repo,
            pull_number
        })

        const sha = sha_resp.data.head.sha
        core.info(`Most recent commit sha: ${sha}`)

        // get last commit msg
        const msg_resp = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: sha
        })

        const msg = msg_resp.data.commit.message
        core.info(`Most recent commit message: "${msg}"`)

        // Use GitHub's API to get files changed in PR.
        // https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests-files
        const files_resp = await octokit.paginate(
            octokit.rest.pulls.listFiles,
            {
                owner,
                repo,
                pull_number,
                per_page
            }
        )

        const allFiles: string[] = []
        for (const file of files_resp) {
            const filename = file.filename
            allFiles.push(filename)
        }

        let output

        switch (encoding) {
            case 'json':
                output = JSON.stringify(allFiles)
                break
            case 'string':
                output = String(allFiles)
                break
            default:
                throw new Error(
                    '"result-encoding" must be either "string" or "json"'
                )
        }

        // debug length
        core.info(`Number of files changed in pull request: ${allFiles.length}`)

        // Set step output context.
        core.setOutput('sha', sha)
        core.setOutput('msg', msg)
        core.setOutput('files', output)
    } catch (error) {
        let errorMessage = 'Failed'
        if (error instanceof Error) {
            errorMessage = error.message
        }
        core.info(errorMessage)
    }
}

run()
