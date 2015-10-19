# Antigenic Cartography for Desktop
[Antigenic Cartography](http://www.antigenic-cartography.org/) is the process of creating maps of antigenically variable pathogens. In some cases two-dimensional maps can be produced which reveal interesting information about the antigenic evolution of a pathogen.

This project aims at providing a desktop application for working with antigenic maps.

## Run the application in development mode
You need ``npm`` installed in order to get this working. The best way to install ``npm`` is to install [node.js](http://www.nodejs.org) using its installer.
### Install project dependencies
In the root folder of your app, run the following command.
```
# Install dependencies
npm install
```

### Start your app
Either download [nw.js](http://nwjs.io/), then simply drag and drop the whole AcmacsDesktop folder on the ``nw.exe``.

Or you can install nw.js through npm:
```
npm install -g nw
```
Now you can type ``nw <PathToApp>`` to start any of your projects. Keep in mind that now you will only have one nw version for all your projects.

## Build

### Install dependencies
```
npm install
```
### Run Grunt
The task runner grunt creates a folder `cache`, downloads the right nw.js version and puts the final app into the `build` folder.
```
grunt
```



## Codacy
[![Codacy Badge](https://api.codacy.com/project/badge/a6df559aeb744d68b598d11a63e9e5e0)](https://www.codacy.com/app/dgora88/AcmacsDesktop)

# License
GNU GENERAL PUBLIC LICENSE  
Version 3, 29 June 2007  
Copyright © 2007 Free Software Foundation, Inc. <http://fsf.org/>  
Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

