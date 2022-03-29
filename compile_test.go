/*
   copyright: (c) 2020 Netskope, Inc. All rights reserved.
*/
package main

// This was lifted from a repo in jboelens' private github account
// eventually that repo will be made public and this can be converted to reference it

import (
	"os"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"testing"
)

// TestMainCompiles is an example of to include a compilation test in main_test
// GetPackageName() uses the call stack to determine the package
// It's imperative that the call to GetPackageName() is inside of the package that requires testing
func TestMainCompiles(t *testing.T) {
	fullPkgName := GetPackageName()
	AttemptCompile(fullPkgName, t)
}

func AttemptCompile(fullPkgName string, t *testing.T) {
	t.Helper()
	pkgName, binaryPath := GetPackageAndBinaryPathWithoutTest(fullPkgName)
	err := RemoveBinary(binaryPath)
	if err != nil {
		t.Errorf("found error removing binary. %s", err)
	}

	err = CompilePackage(pkgName)
	if err != nil {
		t.Errorf("found error compiling binary. %s", err)
	}

	if !BinaryExists(binaryPath) {
		t.Errorf("failed to find compiled binary at %s", binaryPath)
	}
}

// GetPackageAndBinaryPathWithoutTest calculates the package and binary path
func GetPackageAndBinaryPathWithoutTest(fullPkgName string) (string, string) {
	parts := strings.Split(fullPkgName, "/")
	lastParts := strings.Split(parts[len(parts)-1], "_")

	binaryName := lastParts[0]
	fullPkgName = strings.Replace(fullPkgName, parts[len(parts)-1], binaryName, 1)
	binaryPath := GetBinaryPath(binaryName)
	return fullPkgName, binaryPath
}

// GetPackageName returns the package name
// lifted from https://stackoverflow.com/questions/25262754/how-to-get-name-of-current-package-in-go
func GetPackageName() string {
	pc, _, _, _ := runtime.Caller(1)
	parts := strings.Split(runtime.FuncForPC(pc).Name(), ".")
	pl := len(parts)
	pkage := ""
	if parts[pl-2][0] == '(' {
		pkage = strings.Join(parts[0:pl-2], ".")
	} else {
		pkage = strings.Join(parts[0:pl-1], ".")
	}
	return pkage
}

// CompilePackage uses "go install" to build and install the package
func CompilePackage(pkg string) error {
	// #nosec G204
	cmd := exec.Command("go", "install", pkg)
	_, err := cmd.CombinedOutput()
	if err != nil {
		return err
	}
	return nil
}

// GetBinaryRootPath returns the root path in which binaries live
//
// Executables are installed in the directory named by the GOBIN environment
// variable, which defaults to $GOPATH/bin or $HOME/go/bin if the GOPATH
// environment variable is not set. Executables in $GOROOT
// are installed in $GOROOT/bin or $GOTOOLDIR instead of $GOBIN.
func GetBinaryRootPath() string {
	goBin := os.Getenv("GOBIN")
	if goBin != "" {
		return goBin
	}

	goPath := os.Getenv("GOPATH")
	if goPath != "" {
		return path.Join(goPath, "bin")
	}

	return path.Join(os.Getenv("HOME"), "go", "bin")
}

// GetBinaryPath returns the full path to the binary
func GetBinaryPath(binaryName string) string {
	binPath := GetBinaryRootPath()
	return path.Join(binPath, binaryName)
}

// BinaryExists returns true if the binary exists at binaryPath; otherwise returns false
func BinaryExists(binaryPath string) bool {
	if _, err := os.Stat(binaryPath); os.IsNotExist(err) {
		return false
	}
	return true
}

// RemoveBinary removes a binary if it exists at binaryPath
func RemoveBinary(binaryPath string) error {
	if BinaryExists(binaryPath) {
		return os.Remove(binaryPath)
	}
	return nil
}
