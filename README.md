# Antigenic Cartography for Desktop [![Build Status](https://travis-ci.org/acjim/AcmacsDesktop.svg?branch=testing)](https://travis-ci.org/acjim/AcmacsDesktop) [![Codacy Badge](https://api.codacy.com/project/badge/e45c7f2631ad4267b4b91b5c30fefe87)](https://www.codacy.com/app/acjim/AcmacsDesktop)

[Antigenic Cartography](http://www.antigenic-cartography.org/) is the process of creating maps of antigenically variable pathogens. In some cases two-dimensional maps can be produced which reveal interesting information about the antigenic evolution of a pathogen.

This project aims at providing a desktop application for working with antigenic maps.

## Include Core
To be able to use the app you need the latest version of the **AcmacsCore.bundle**. You can download it [here](https://drive.google.com/open?id=0B3SjWA2XVkqCTERmV1BJUkZOYzA).

Unzip and put the binaries in the `core` folder.

## Run the application (development mode)
You need ``npm`` installed in order to get this working. The best way to install ``npm`` is to install [node.js](http://www.nodejs.org) using its installer.


Run the following command in the root folder of the project (where this ``README.md`` is located):
```sh
npm install
```
And start the application with:
```sh
npm start
```

## Build the application (for deployment)
You need ``grunt`` installed to get this working. The best option is probably to install it globally:
```sh
npm install -g grunt
```

#### Install dependencies
Install all project dependencies
```sh
npm install
```
#### Build AcmacsDesktop application
The task runner grunt creates a folder `cache`, downloads the right nw.js version and puts the final app into the `build` folder.
```sh
grunt build
```
To prevent errors, you should only build the application on the system you are building it for. For example, if you would 
like to make an ``OSX 32-bit`` build then build it on that specific architecture. 

By default, the app is only built for the platform you are on. However, you can provide your desired build targets as parameters:
```sh
grunt build --target=<target>
```
with the following possible targets:
```sh
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

#### Packaging the application
Currently, only `DMG` packaging for OS X is supported and you need to be on OS X in order for this to work.
```sh
grunt package
```


# License
GNU GENERAL PUBLIC LICENSE  
Version 3, 29 June 2007  
Copyright © 2007 Free Software Foundation, Inc. <http://fsf.org/>  
Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

