#!/bin/bash

export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH

# Always run from this repository's backend directory (avoid hard-coded paths)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Compiling backend..."
/opt/homebrew/bin/mvn clean compile -DskipTests

echo "🚀 Starting backend..."
/opt/homebrew/bin/mvn org.springframework.boot:spring-boot-maven-plugin:3.2.1:run -DskipTests
