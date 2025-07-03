# Example Smart Contract Project

This project is an example of a smart contract project using the Neo blockchain. It includes a simple NEP-17 contract, with its own build and test configurations.

## Requirements

- .NET 9
- nodejs >= 18

## Setup

### Restore Tools

To restore the required tools, run the following command in the root of the project:

```bash
dotnet tool restore
```

### Building contracts

To build all the contracts, go into the root of the project and execute:

```bash
dotnet restore
```

and

```bash
dotnet build
```

### Installing node dependencies

To install node packages run:

```bash
npm install
```

## Build

Each contract project inside the src folder has a **build.js** file that is called during msbuild process while building the contract.

It contains 4 commands that are executed at different stages of contract build and allow for contract output customization for building and testing.

### Modify

Executed prior to nccs contract build. It allows contract code customization, like replacing some constant values, modifying defined contract values.

To avoid applying persistent changes to the code, it creates a backup of the original files in a temporary folder so that changes can be reverted after building process is executed.

### Revert

Clean modified contract using temporary backup folder and remove it.

### Clean

Apply further cleanups if needed. mainly in contract build output directory (/bin/sc).

### Copy

Copy the artifacts generated with the nccs build to the "TestingArtifact" folder so that they can be used for testing (.artifacts.cs and .nefdbgnfo files). It also do some file naming cleanup so that the .artifact.cs file generated is always a valid c# file.

While doing so it also generates a "_ + PROJECT_NAME + .artifacts.json" file containing info about last build execution. This file is used to have informations regarding last build and files built.

## Testing

In order to run the tests run the command:

```bash
dotnet test
```

CreateTestEngine() method is called when initializing test engine and it's the place where contracts initialization should take place.

All the methods with the decorator **[TestMethod]** on classes that inherit `Neo.SmartContract.Testing.TestingStandards.TestBase` will be executed on the test engine during tests execution.
