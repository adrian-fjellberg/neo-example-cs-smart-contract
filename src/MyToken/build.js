const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { backupBuildFiles, revertBuildFiles, copyArtifactFiles, safeDeleteFolder } = require('../../utils/build-utils');


// Script directory
const PROJECT_DIR = path.resolve(__dirname);
// Backup directory
const BACKUP_DIR = path.join(PROJECT_DIR, 'backup');
// Build directory
const BUILD_DIR = path.join(PROJECT_DIR, 'bin', 'sc');
// Artifact directory
const ARTIFACT_DIR = path.join(PROJECT_DIR, '../', '../', 'tests', 'MyToken.Tests', 'TestingArtifacts');

// NB: Main assumption, as is today, modifications are done only in root .cs files
yargs(hideBin(process.argv))
	.command(
		'modify [target]',
		'Modify the source files',
		(yargs) => {
			yargs.positional('target', {
				describe: 'The target build configuration',
				type: 'string',
				default: 'unittests',
			});
		},
		({ target }) => {
			// Check for uncommitted changes if target is "mainnet" or "testnet"
			if (target === 'mainnet' || target === 'testnet') {
				const hasUncommittedChanges = checkUncommittedChanges();
				if (hasUncommittedChanges) {
					console.error('Error: There are uncommitted changes in the repository. Commit or stash changes before proceeding.');
					process.exit(1);
				}
			}

			const config = loadConfig(target);

			// Backup build files and get them back to apply modifications
			const csharpFiles = backupBuildFiles(PROJECT_DIR, BACKUP_DIR);

			// Define replacements
			const replacements = [
				{
					pattern: new RegExp('InitialOwner = "INITIAL_OWNER";', 'g'),
					replacement: `InitialOwner = "${config.initialOwner}";`,
				},
			];

			// Apply modifications
			const modifiedFiles = new Map(); // To store modified content temporarily
			const replacementCounters = new Map(replacements.map(({ pattern }) => [pattern, 0]));

			for (const file of csharpFiles) {
				const filePath = path.join(PROJECT_DIR, file);
				let content = fs.readFileSync(filePath, 'utf8');

				replacements.forEach(({ pattern, replacement }) => {
					const matches = content.match(pattern);
					if (matches) {
						replacementCounters.set(pattern, replacementCounters.get(pattern) + matches.length);
						content = content.replace(pattern, replacement);
					}
				});

				modifiedFiles.set(filePath, content); // Store modified content without writing
			}

			replacementCounters.forEach((count, pattern) => {
				if (count !== 1) {
					console.error(`Error: Expected exactly one replacement for pattern ${pattern}, but found ${count}.`);
					process.exit(1);
				}
			});

			// Write the files only after all checks pass
			modifiedFiles.forEach((content, filePath) => {
				fs.writeFileSync(filePath, content);
			});

			// Delete build folder so that everything is always clear for the new build
			safeDeleteFolder(BUILD_DIR);
		},
	)
	.command(
		'revert',
		'Revert the modifications',
		() => {},
		() => revertBuildFiles(PROJECT_DIR, BACKUP_DIR),
	)
	.command(
		'clean',
		'Do final further cleanups',
		() => {},
		() => {
			// Delete original file that has been built but is useless
			// It has been built because otherwise msbuild trigger an error not finding original file
			const originalFiles = fs.readdirSync(BUILD_DIR).filter((file) => file.startsWith('Nep17Token'));
			originalFiles.forEach((file) => fs.unlinkSync(path.join(BUILD_DIR, file)));
		},
	)
	.command(
		'copy',
		'Copy the artifacts to testing folder',
		() => {},
		() => copyArtifactFiles(BUILD_DIR, ARTIFACT_DIR, path.basename(PROJECT_DIR)),
	)
	.demandCommand(1, 'You must provide a valid command.')
	.help()
	.parse();

function formatClassName(input) {
	// Remove any non-alphanumeric characters and spaces
	return input.replace(/[^a-zA-Z0-9_]/g, '').replace(/\s+/g, '');
}

function replaceFirstWord(originalString, newValue) {
	// Split the string into an array of words
	let parts = originalString.split('.');
	// Remove the first element of the array and replace it
	parts.shift();
	parts.unshift(newValue);
	// Join the parts back into a single string with periods
	return parts.join('.');
}

function loadConfig(target) {
	const configPath = path.join(PROJECT_DIR, 'buildConfig', `${target}.config.js`);
	if (!fs.existsSync(configPath)) {
		throw new Error(`Config file not found: ${configPath}`);
	}
	return require(configPath);
}
