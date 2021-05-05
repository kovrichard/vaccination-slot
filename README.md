# vaccination-slot

## Setting up the environment

1. Install Truffle to handle smart contracts

```
npm install -g truffle
```

2. Install [Ganache](https://www.trufflesuite.com/ganache) to run a local blockchain
3. Create a Ganache workspace with **New Workspace**
    - Add a workspace name
    - Click on **Add project** and find your `truffle-config.js`
    - Click **Save workspace**

## Useful commands

On Windows, use [nmake](https://docs.microsoft.com/en-us/cpp/build/reference/nmake-reference?view=msvc-160&viewFallbackFrom=vs-2019) instead of `make`

Build smart contracts:

```
make build
```

Deploy smart contracts:

```
make deploy
```

Clear workspace:

```
make clear
```

Get a Truffle console:

```
make sh
```
