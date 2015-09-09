# AcmacsCore.bundle
We use a special version of https://github.com/acorg/acmacs.git as our backend to do all the calculations.
In order get the application to work, you have to put a compiled version of the core bundle into this folder.

## Build AcmacsCore.bundle on OS X
1. Get current version of Acmacs: https://github.com/acorg/acmacs.git
2. Prerequisites
	- OS X Command Line Developer Tools
	- pkg-config (install over homebrew)
3. Set $ACMACS_ROOT environment variable to point to the Acmacs folder
4. Build AcmacsCore package
   `$ACMACS_ROOT/bin/c2r-build CORE`
5. Navigate to `$ACMACS_ROOT`
6. Build core bundle
`bin/c2env make -j acmacs-core-bundle`
It will create a tree under ~/Desktop/AcmacsCore.bundle on OSX

## Build AcmacsCore.bundle on Ubuntu
To Do