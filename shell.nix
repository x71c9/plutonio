{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [
    pkgs.nodejs_24
    pkgs.nodePackages_latest.yarn
    pkgs.nodePackages_latest.typescript
    pkgs.nodePackages_latest.typescript-language-server
  ];
  shellHook = ''
    export NODE_ENV=development
    echo "node: $(node -v) | npm: $(npm -v) | yarn: $(yarn -v) | typescript: $(tsc -v)"
  '';
}

