import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import path from 'path'

function extensions(filter: string): string[] {
    const tempExtList = filter.split(',')
    const extList: string[] = []

    for (const ext of tempExtList) {
        if (!ext.startsWith('.')) {
            extList.push(`.${ext}`)
            continue
        }
        extList.push(ext)
    }
    return extList
}

function filterFilesByExtension(files: string[], ext: string[]): string[] {
    const filesFiltered = files.filter(file =>
        ext.includes(path.extname(file).toLowerCase())
    )
    return filesFiltered
}

async function run(): Promise<void> {
    try {
        // Get inputs
        const token = core.getInput('token', {required: true})
        const repository = core.getInput('repository', {required: true})
        const filter = core.getInput('filter', {required: true})
        const extList = extensions(filter)

        // Create GitHub client with the token.
        const client = getOctokit(token)

        // Debug the inputs.
        core.info(`Repository: ${repository}`)
        core.info(`Filter: ${filter}`)
        core.info(`Extensions: ${extList}`)

        // Get event name.
        const eventName = context.eventName
        core.info(`Event name: ${eventName}`)

        // Define the base and head commits to be extracted from the payload.
        let base = ''
        let head = ''

        switch (eventName) {
            case 'pull_request':
                base = context.payload.pull_request?.base?.sha
                head = context.payload.pull_request?.head?.sha
                break
            case 'push':
                base = context.payload.before
                head = context.payload.after
                break
            default:
                core.setFailed(
                    `This action only supports pull requests and pushes, ${context.eventName} events are not supported.`
                )
        }

        // Log the base and head commits
        core.info(`Base commit: ${base}`)
        core.info(`Head commit: ${head}`)

        // Ensure that the base and head properties are set on the payload.
        if (!base || !head) {
            core.setFailed(
                `The base and head commits are missing from the payload for this ${context.eventName} event`
            )
        }

        // Use GitHub's compare two commits API.
        // https://developer.github.com/v3/repos/commits/#compare-two-commits
        const response = await client.rest.repos.compareCommits({
            base,
            head,
            owner: context.repo.owner,
            repo: context.repo.repo
        })

        // Ensure that the request was successful.
        if (response.status !== 200) {
            core.setFailed(
                `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200`
            )
        }

        // Ensure that the head commit is ahead of the base commit.
        if (response.data.status !== 'ahead') {
            core.setFailed(
                `The head commit for this ${context.eventName} event is not ahead of the base commit`
            )
        }

        // Get the changed files from the response payload.
        const files = response.data.files || []
        const allFiles = [] as string[]

        for (const file of files) {
            const filename = file.filename
            allFiles.push(filename)
        }

        // Filter files by extension
        const filteredFiles = filterFilesByExtension(allFiles, extList)

        // Format the arrays of changed files.
        const allFormatted: string = JSON.stringify(filteredFiles)

        // Set step output context.
        core.setOutput('files', allFormatted)
    } catch (error) {
        let errorMessage = 'Failed'
        if (error instanceof Error) {
            errorMessage = error.message
        }
        core.info(errorMessage)
    }
}

run()
