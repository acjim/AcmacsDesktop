# Antigenic Cartography for Desktop [![Build Status](https://travis-ci.org/acjim/AcmacsDesktop.svg?branch=testing)](https://travis-ci.org/acjim/AcmacsDesktop) [![Codacy Badge](https://api.codacy.com/project/badge/e45c7f2631ad4267b4b91b5c30fefe87)](https://www.codacy.com/app/acjim/AcmacsDesktop)

[Antigenic Cartography](http://www.antigenic-cartography.org/) is the process of creating maps of antigenically variable pathogens. In some cases two-dimensional maps can be produced which reveal interesting information about the antigenic evolution of a pathogen.

This project aims at providing a desktop application for working with antigenic maps.

## Include Core
To be able to use the app you need the latest version of the **AcmacsCore.bundle**. You can download it [here](https://drive.google.com/open?id=0B3SjWA2XVkqCTERmV1BJUkZOYzA).

Unzip and put the binaries in the folder: `src/core`

## Run the application in development mode
You need ``npm`` installed in order to get this working. The best way to install ``npm`` is to install [node.js](http://www.nodejs.org) using its installer.
### Install project dependencies
In the root folder of your app, run the following command.
```
npm install
```

### Update project dependencies
If you already got the application running, but some dependencies changed, type:
```
npm update
```

### Start your app
```
npm start
```

## Build Instructions

### Install dependencies
```
npm install
```
### Build AcmacsDesktop application
The task runner grunt creates a folder `cache`, downloads the right nw.js version and puts the final app into the `build` folder.
```
grunt build
```
By default, the app is only built for the platform you are on. However, you can provide your desired build targets as parameters:
```javascript
grunt build --target=<target>
```
with the following possible targets:
```javascript
//Builds 32bit and 64bit ...
osx
linux
win
//... or provide the arch
osx32
linux64
...
```
Keep in mind that you should exchange the **AcmacsCore.bundle** to the target you are building for.

### Package
Currently, only `DMG` packaging for OS X is supported.
```
grunt package
```

# License
GNU GENERAL PUBLIC LICENSE  
Version 3, 29 June 2007  
Copyright © 2007 Free Software Foundation, Inc. <http://fsf.org/>  
Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

